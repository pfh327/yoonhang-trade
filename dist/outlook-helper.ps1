$ErrorActionPreference='SilentlyContinue'
$listener=New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:8765/')
$listener.Start()
$outlook=$null
try{$outlook=New-Object -ComObject Outlook.Application}catch{}
function Write-Json($ctx,$obj){$body=($obj|ConvertTo-Json -Depth 5);$bytes=[Text.Encoding]::UTF8.GetBytes($body);$ctx.Response.Headers.Add('Access-Control-Allow-Origin','*');$ctx.Response.ContentType='application/json; charset=utf-8';$ctx.Response.ContentLength64=$bytes.Length;$ctx.Response.OutputStream.Write($bytes,0,$bytes.Length);$ctx.Response.Close()}
while($listener.IsListening){$ctx=$listener.GetContext();$path=$ctx.Request.Url.AbsolutePath
if($path -eq '/health'){Write-Json $ctx @{outlook=($null -ne $outlook);running=$true};continue}
if($path -eq '/replies' -and $null -ne $outlook){$ns=$outlook.GetNameSpace('MAPI');$inbox=$ns.GetDefaultFolder(6);$items=$inbox.Items;$items.Sort('[ReceivedTime]', $true);$out=@();$n=0;foreach($item in $items){if($n -ge 100){break};if($item.Class -eq 43){$out+=@{sender=[string]$item.SenderEmailAddress;subject=[string]$item.Subject;received=([datetime]$item.ReceivedTime).ToString('o')};$n++}};Write-Json $ctx @{replies=$out};continue}
Write-Json $ctx @{error='unknown endpoint'}}