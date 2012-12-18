<?php

if(@$_GET['action']) {
	echo "<span style='font-family:Consolas;font-size:12px'>";
	chdir( getcwd() );
	$repo = array_pop(explode('/', getcwd()));
	$out = false;
	switch($_GET['action']) {
		case 'pullbb':
			exec('git pull 2>&1',$out);
			break;
		case 'pushbb':
			exec('git push 2>&1',$out);
			break;
		case 'status':
			exec('git status 2>&1',$out);
			break;
		case 'reset':
			exec('git checkout -f 2>&1',$out);
			break;
		case 'resetfile':
			$fn = $_GET['fn'];
			exec("git checkout -- $fn 2>&1",$out);
			break;
		case 'mergelive':
			exec('git merge origin/master 2>&1',$out);
			break;
		case 'pushlive':
			chdir('/var/www/ethryx.net/live');
			exec('git pull 2>&1',$out);
			exec('git merge origin/'.$repo.' 2>&1',$out);
			exec('git push 2>&1',$out);
			break;
		case 'commit':
			$msg = $_GET['message'];
			$msg = str_replace("'", "\\'", $msg);
			exec("git commit -a -m '$msg' 2>&1",$out);
			break;
		case 'add':
			$fn = $_GET['fn'];
			exec("git add $fn 2>&1",$out);
			break;
		case 'remove':
			$fn = $_GET['fn'];
			exec("git rm -r --cached $fn 2>&1",$out);
			break;
		default:
			die('invalid cmd');
	}
	echo implode('<br>',$out);
	echo "</span>";
	exit;
}

?>

<span style="font-family:Consolas;font-size:12px">
	<b>Repository:</b> <?=getcwd()?> <br>
	<br>
	<b>Pulling / Pushing</b> <br>
	<a href="?action=pullbb">Pull Changes From BitBucket</a> <br>
	<a href="?action=pushbb">Push Changes To BitBucket</a> <br>
	<br>
	<b>Repo Actions</b> <br>
	<a href="?action=status">View Status</a> <br>
	<a href="?action=reset" onclick="return confirm('Are you sure?');">Reset Repository to HEAD</a> <br>
	<a href="#" onclick="var msg=prompt('File name?');if(msg){document.location='git.php?action=resetfile&fn='+msg}return false;">Reset Specific File to HEAD</a> <br>
	<a href="?action=mergelive">Merge Changes From Master (Live)</a> <br>
	<a href="#" onclick="var msg=prompt('Commit message?');if(msg){document.location='git.php?action=commit&message='+msg}return false;">Commit & Automatically Stage Changed Files</a> <br>
	<a href="#" onclick="var msg=prompt('File name?');if(msg){document.location='git.php?action=add&fn='+msg}return false;">Add File to Repo</a> <br>
	<a href="#" onclick="var msg=prompt('File name?');if(msg){document.location='git.php?action=remove&fn='+msg}return false;">Remove File to Repo</a> (Cached: Will remain in file system)<br>
	<br>
	<b>Deploying</b> <br>
	<a href="?action=pushlive">Push Changes To Master (Live)</a> <br>
</span>
