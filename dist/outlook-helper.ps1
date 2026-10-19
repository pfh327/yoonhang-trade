$ErrorActionPreference='Stop'
try {
  $listener=New-Object System.Net.HttpListener
  $listener.Prefixes.Add('http://127.0.0.1:8766/')
  $listener.Start()
  Write-Host 'Outlook 연결 도우미가 실행 중입니다. 이 창을 닫지 마세요.' -ForegroundColor Green
  $outlook=$null
  try{$outlook=New-Object -ComObject Outlook.Application}catch{Write-Host 'Outlook 프로그램을 찾지 못했습니다. Outlook을 먼저 실행하세요.' -ForegroundColor Yellow}
  function Write-Json($ctx,$obj){$body=($obj|ConvertTo-Json -Depth 5);$bytes=[Text.Encoding]::UTF8.GetBytes($body);$ctx.Response.Headers.Add('Access-Control-Allow-Origin','*');$ctx.Response.ContentType='application/json; charset=utf-8';$ctx.Response.ContentLength64=$bytes.Length;$ctx.Response.OutputStream.Write($bytes,0,$bytes.Length);$ctx.Response.Close()}
  while($listener.IsListening){$ctx=$listener.GetContext();$path=$ctx.Request.Url.AbsolutePath
    if($path -eq '/health'){Write-Json $ctx @{outlook=($null -ne $outlook);running=$true};continue}
    if($path -eq '/replies' -and $null -ne $outlook){$ns=$outlook.GetNameSpace('MAPI');$inbox=$ns.GetDefaultFolder(6);$items=$inbox.Items;$items.Sort('[ReceivedTime]', $true);$out=@();$n=0;foreach($item in $items){if($n -ge 100){break};if($item.Class -eq 43){$out+=@{sender=[string]$item.SenderEmailAddress;subject=[string]$item.Subject;received=([datetime]$item.ReceivedTime).ToString('o')};$n++}};Write-Json $ctx @{replies=$out};continue}
    Write-Json $ctx @{error='unknown endpoint'}
  }
} catch {
  Write-Host ('오류: ' + $_.Exception.Message) -ForegroundColor Red
  Read-Host 'Enter를 누르면 닫힙니다'
}