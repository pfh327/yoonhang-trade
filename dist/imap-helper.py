import os, json, imaplib, smtplib, email
from email.header import decode_header
from email.utils import parsedate_to_datetime
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

PORT = 18766
CONFIG_DIR = Path(os.environ.get('LOCALAPPDATA', str(Path.home()))) / 'YoonhangTrade'
CONFIG_PATH = CONFIG_DIR / 'imap-config.json'

def read_config():
    try:
        return json.loads(CONFIG_PATH.read_text(encoding='utf-8'))
    except Exception:
        return None

def connect():
    cfg = read_config()
    if not cfg or not cfg.get('email') or not cfg.get('code'):
        raise RuntimeError('126메일 주소와 인증코드를 먼저 저장하세요.')
    box = imaplib.IMAP4_SSL('imap.126.com', 993)
    box.login(cfg['email'], cfg['code'])
    return box

def decode_text(value):
    if not value:
        return ''
    out=[]
    for part, enc in decode_header(value):
        if isinstance(part, bytes):
            out.append(part.decode(enc or 'utf-8', errors='replace'))
        else:
            out.append(part)
    return ''.join(out)

def message_body(msg):
    if msg.is_multipart():
        parts = msg.walk()
    else:
        parts = [msg]
    for part in parts:
        if part.get_content_type() != 'text/plain':
            continue
        try:
            return part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='replace')
        except Exception:
            return ''
    return ''

def response_items():
    box = connect()
    try:
        box.select('INBOX', readonly=True)
        typ, data = box.search(None, 'ALL')
        ids = data[0].split()[-100:]
        out=[]
        for msg_id in reversed(ids):
            typ, msg_data = box.fetch(msg_id, '(RFC822)')
            raw = b''.join(x[1] for x in msg_data if isinstance(x, tuple))
            msg = email.message_from_bytes(raw)
            received = msg.get('Date','')
            try:
                received = parsedate_to_datetime(received).isoformat()
            except Exception:
                pass
            out.append({'sender': decode_text(msg.get('Reply-To') or msg.get('From')), 'subject': decode_text(msg.get('Subject')), 'body': message_body(msg), 'received': received})
        return out
    finally:
        try: box.logout()
        except Exception: pass

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    def send_json(self, payload, status=200):
        raw=json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Headers','Content-Type')
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.end_headers(); self.wfile.write(raw)
    def do_OPTIONS(self):
        self.send_json({'ok':True})
    def do_GET(self):
        if self.path == '/health':
            try:
                box=connect(); box.logout(); self.send_json({'running':True,'imap':True})
            except Exception as e:
                self.send_json({'running':True,'imap':False,'error':str(e)})
        elif self.path == '/replies':
            try: self.send_json({'replies':response_items()})
            except Exception as e: self.send_json({'replies':[],'error':str(e)}, 200)
        else: self.send_json({'error':'unknown endpoint'},404)
    def do_POST(self):
        if self.path == '/send':
            try:
                length=int(self.headers.get('Content-Length','0')); data=json.loads(self.rfile.read(length).decode('utf-8'))
                to=str(data.get('to','')).strip(); subject=str(data.get('subject','')).strip(); body=str(data.get('body',''))
                if not to or not subject or not body: raise ValueError('받는 사람, 제목, 내용을 입력하세요.')
                cfg=read_config()
                if not cfg: raise ValueError('126메일 연결을 먼저 저장하세요.')
                msg=EmailMessage(); msg['From']=cfg['email']; msg['To']=to; msg['Subject']=subject; msg.set_content(body)
                smtp=smtplib.SMTP_SSL('smtp.126.com',465,timeout=30); smtp.login(cfg['email'],cfg['code']); smtp.send_message(msg); smtp.quit()
                self.send_json({'ok':True})
            except Exception as e: self.send_json({'ok':False,'error':str(e)},400)
            return
        if path != '/configure': return self.send_json({'error':'unknown endpoint'},404)
        try:
            length=int(self.headers.get('Content-Length','0'))
            data=json.loads(self.rfile.read(length).decode('utf-8'))
            email_addr=str(data.get('email','')).strip(); code=str(data.get('code','')).strip()
            if not email_addr or not code: raise ValueError('주소와 인증코드를 입력하세요.')
            CONFIG_DIR.mkdir(parents=True, exist_ok=True)
            CONFIG_PATH.write_text(json.dumps({'email':email_addr,'code':code},ensure_ascii=False),encoding='utf-8')
            box=connect(); box.logout()
            self.send_json({'ok':True,'imap':True})
        except Exception as e: self.send_json({'ok':False,'error':str(e)},400)

print('126메일 도우미 v2가 실행 중입니다. 이 창을 닫지 마세요.')
print('연결 확인 주소: http://127.0.0.1:18766/health')
HTTPServer(('127.0.0.1',PORT), Handler).serve_forever()


