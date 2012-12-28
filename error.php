<?

$data =  "-----\n";
$data .= "Remote IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
$data .= "Client Version: {$_POST['version']}\n";
$data .= "Message: {$_POST['msg']}\n";
$data .= "Location: {$_POST['loc']}\n";
$data .= "Line Number: {$_POST['line']}\n";
$data .= "-----\n\n";

file_put_contents('errors.txt', $data, FILE_APPEND | LOCK_EX);

?>