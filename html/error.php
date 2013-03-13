<?

// report to file
$data =  "-----\n";
$data .= "Remote IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
$data .= "Client Version: {$_POST['version']}\n";
$data .= "Message: {$_POST['msg']}\n";
$data .= "Location: {$_POST['loc']}\n";
$data .= "Line Number: {$_POST['line']}\n";
$data .= "-----\n\n";
file_put_contents('errors.txt', $data, FILE_APPEND | LOCK_EX);

// report to bitbucket
$data = str_replace("\n", '<br>', $data);
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.bitbucket.org/1.0/repositories/Ethryx/armeria/issues");
curl_setopt($ch, CURLOPT_USERPWD, "ethryx:xyrhte89");
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, "title=Javascript Error: {$_POST['msg']}&content={$_POST['msg']} (Location: {$_POST['loc']} [{$_POST['line']}])&component=client&responsible=Ethryx");
curl_exec($ch);
curl_close($ch);

?>
