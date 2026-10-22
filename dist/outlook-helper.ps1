$ErrorActionPreference='Stop'
try {
  $listener=New-Object System.Net.HttpListener
  $listener.Prefixes.Add('http://127.0.0.1:8766/')
  $listener.Start()
  Write-Host 'Outlook 鞐瓣舶 霃勳毎氙戈皜 鞁ろ枆 欷戩瀰雼堧嫟. 鞚?彀届潉 雼 毵堨劯鞖?' -ForegroundColor Green
  $outlook=$null
  try{$outlook=New-Object -ComObject Outlook.Application}catch{Write-Host 'Outlook 頂勲攴鸽灗鞚?彀眷 氇豁枅鞀惦媹雼? Outlook鞚?毹检爛 鞁ろ枆頃橃劯鞖?' -ForegroundColor Yellow}
  function Write-Json($ctx,$obj){$body=($obj|ConvertTo-Json -Depth 5);$bytes=[Text.Encoding]::UTF8.GetBytes($body);$ctx.Response.Headers.Add('Access-Control-Allow-Origin','*');$ctx.Response.ContentType='application/json; charset=utf-8';$ctx.Response.ContentLength64=$bytes.Length;$ctx.Response.OutputStream.Write($bytes,0,$bytes.Length);$ctx.Response.Close()}
  function Read-RequestJson($ctx){$reader=New-Object IO.StreamReader($ctx.Request.InputStream,[Text.Encoding]::UTF8);try{return ($reader.ReadToEnd()|ConvertFrom-Json)}finally{$reader.Close()}}
  while($listener.IsListening){$ctx=$listener.GetContext();$path=$ctx.Request.Url.AbsolutePath
    if($path -eq '/health'){Write-Json $ctx @{outlook=($null -ne $outlook);running=$true};continue}
    if($path -eq '/replies' -and $null -ne $outlook){$ns=$outlook.GetNameSpace('MAPI');$inbox=$ns.GetDefaultFolder(6);$items=$inbox.Items;$items.Sort('[ReceivedTime]', $true);$out=@();$n=0;foreach($item in $items){if($n -ge 100){break};if($item.Class -eq 43){$out+=@{sender=[string]$item.SenderEmailAddress;subject=[string]$item.Subject;body=[string]$item.Body;received=([datetime]$item.ReceivedTime).ToString('o')};$n++}};Write-Json $ctx @{replies=$out};continue}
    if($path -eq '/reply' -and $ctx.Request.HttpMethod -eq 'POST' -and $null -ne $outlook){$req=Read-RequestJson $ctx;$email=[string]$req.email;$text=[string]$req.body;$ns=$outlook.GetNameSpace('MAPI');$inbox=$ns.GetDefaultFolder(6);$items=$inbox.Items;$items.Sort('[ReceivedTime]', $true);$found=$null;$n=0;foreach($item in $items){if($n -ge 200){break};if($item.Class -eq 43 -and ([string]$item.SenderEmailAddress).ToLower() -eq $email.ToLower()){$found=$item;break};$n++};if($null -eq $found){Write-Json $ctx @{ok=$false;error='matching email not found'};continue};$reply=$found.Reply();$safe=[System.Net.WebUtility]::HtmlEncode($text).Replace([Environment]::NewLine,'<br>');$reply.HTMLBody='<div>'+ $safe + '</div><br><hr><br>'+[string]$reply.HTMLBody;$reply.Display($false);Write-Json $ctx @{ok=$true;subject=[string]$reply.Subject};continue}
    Write-Json $ctx @{error='unknown endpoint'}
  }
} catch {
  Write-Host ('鞓る: ' + $_.Exception.Message) -ForegroundColor Red
  Read-Host 'Enter毳?雸勲ゴ氅?雼灆雼堧嫟'
}
