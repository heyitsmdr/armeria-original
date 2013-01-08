<html>
    <head>
        <title>Armeria: Social MUD</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
        <!-- Stylesheets -->
        <link id="cssReset" rel="stylesheet" type="text/css" href="css/reset.css">
        <link id="cssStandard" rel="stylesheet" type="text/css" href="css/style.css">
        <link rel="stylesheet" type="text/css" href="libraries/gritter/css/jquery.gritter.css">
        <link href='http://fonts.googleapis.com/css?family=Paprika' rel='stylesheet' type='text/css'>
        <!-- Scripts -->
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
        <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js"></script>
        <script src="engine.js"></script>
        <script src="libraries/soundmanager2/js/soundmanager2.js"></script>
        <script type="text/javascript" src="libraries/gritter/js/jquery.gritter.js"></script>
        <script src="http://ethryx.net:<?php echo file_get_contents('./port') ?>/socket.io/socket.io.js"></script>
        <script type="text/javascript">
            $(document).ready(function(){
                GameEngine.init(<?php echo file_get_contents('./port') ?>);
                GameEngine.version = '<?php echo date("D M d Y H:i:s \G\M\TO (T)", filemtime(__FILE__)); ?>';
            });
        </script>
    </head>
    <body>
        <!-- Animated Fog -->
        <div id="fog"></div>
        <!-- Facebook Integration -->
        <div id="fb-root"></div>
        <script>
          window.fbAsyncInit = function() {
            FB.init({
              appId      : '388221831260979', // App ID
              channelUrl : '//ethryx.net/channel.html', // Channel File
              status     : true, // check login status
              cookie     : true, // enable cookies to allow the server to access the session
              xfbml      : true  // parse XFBML
            });

          };
        
          // Load the SDK Asynchronously
          (function(d){
             var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
             if (d.getElementById(id)) {return;}
             js = d.createElement('script'); js.id = id; js.async = true;
             js.src = "//connect.facebook.net/en_US/all.js";
             ref.parentNode.insertBefore(js, ref);
           }(document));
           
           function movementButtonClick(c){
               $('#inputGameCommands').val(c);
               GameEngine.parseCommand();
           };
        </script>
        <!-- Google Analytics -->
        <script type="text/javascript">

            var _gaq = _gaq || [];
            _gaq.push(['_setAccount', 'UA-37218324-1']);
            _gaq.push(['_setDomainName', 'playarmeria.com']);
            _gaq.push(['_trackPageview']);

            (function() {
                var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
                ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
            })();

        </script>
        
        <!-- Game Client -->
        <div id="status" class="shadow border222">
            <div id="updateStatus"></div>
            <div id="networkStatus"></div>
        </div>
        <div id="wrapSidebar">
            <div id="frameLogo">Logo</div>
            <div id="outerFramePlayerList">
                <div id="framePlayerList" class="shadow border222">
                    <ul id="playerList"></ul>
                </div>
            </div>
            <div id="outerFrameStats">
                <div id="innerFrameStats" class="shadow border222">
                    <div id="frameStats" class="shadow2">
                        <table id="playerStats" cellpadding="3" cellspacing="3">
                            <tr>
                        		<td><span class="statName">ABC</span><br/>69</td>
                        		<td><span class="statName">ABC</span><br/>69</td>
                        	</tr>
                        	<tr>
                        		<td><span class="statName">ABC</span><br/>69</td>
                        		<td><span class="statName">ABC</span><br/>69</td>
                        	</tr>
                        	<tr>
                        		<td><span class="statName">ABC</span><br/>69</td>
                        		<td><span class="statName">ABC</span><br/>69</td>
                        	</tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div id="wrapGameArea">
            <div id="outerFrameGame">
                <div id="innerFrameGame" class="shadow border222">
                    <div id="frameGame" class="shadow2">
                        
                    </div>
                    <div id="frameGameMap" class="shadow border222">
                        <div id="gameMap">
                            <canvas id="gameMapCanvas" width="240px" height="240px"></canvas>
                            <div id="playerMark"></div>
                            <div id="mapShadow" class="shadow2"></div>
                        </div>
                        <p id="mapName"></p>
                    </div>
                    
                </div>
            </div>
            <div id="outerFrameInput">
                <div id="frameInput" class="shadow border222">
                    <input type="text" id="inputGameCommands" placeholder="Type commands here.." class="shadow2 border333"/>
                </div>
            </div>

            <table border="0" frame="void" id="movementControls">
            <tr>
                <td><input type="button" id="act_Attack" class="movementButton shadow2 border333" onClick="movementButtonClick('/attack')"/></td>
                <td><input type="button" id="dir_N" class="movementButton shadow2 border333" onClick="movementButtonClick('n')"/></td>
                <td><input type="button" id="dir_U" class="movementButton shadow2 border333" onClick="movementButtonClick('u')"/></td>
            </tr>
            <tr>
                <td><input type="button" id="dir_W" class="movementButton shadow2 border333" onClick="movementButtonClick('w')"/></td>
                <td><input type="button" id="act_Look" class="movementButton shadow2 border333" onClick="movementButtonClick('/look')"/></td>
                <td><input type="button" id="dir_E" class="movementButton shadow2 border333" onClick="movementButtonClick('e')"/></td>
            </tr>
            <tr>
                <td></td>
                <td><input type="button" id="dir_S" class="movementButton shadow2 border333" onClick="movementButtonClick('s')"/></td>
                <td><input type="button" id="dir_D" class="movementButton shadow2 border333" onClick="movementButtonClick('d')"/></td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td><input type="button" id="editMode" class="movementButton shadow2 border333" onClick="movementButtonClick('/editmode on')" value="Edit" style="background-color: rgba(120, 0, 0, 0.3);"/></td>
            </tr>
            </table>
        </div>
    </body>
</html>
