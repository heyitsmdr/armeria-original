<?php
    // port
    $port = file_get_contents('./port');
?>
<html>
    <head>
        <title>Armeria: Social MUD</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
        <!-- Stylesheets -->
        <link id="cssReset" rel="stylesheet" type="text/css" href="css/reset.css">

        <?php require 'less.php'; ?>


        <link rel="stylesheet" type="text/css" href="libraries/gritter/css/jquery.gritter.css">
        <link href='http://fonts.googleapis.com/css?family=Open+Sans:400italic,600italic,700italic,800italic,400,800,700,600' rel='stylesheet' type='text/css'>
        <!-- Scripts -->
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
        <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js"></script>
        <script src="engine.js?buildTime=<?=filemtime('./css/style.less')?>"></script>
        <script src="libraries/soundmanager2/js/soundmanager2.js"></script>
        <script type="text/javascript" src="libraries/gritter/js/jquery.gritter.js"></script>
        <script src="http://www.playarmeria.com:<?=$port?>/socket.io/socket.io.js"></script>
        <script type="text/javascript">
            $(document).ready(function(){
                GameEngine.init(<?=$port?>);
                GameEngine.version = '<?=filemtime(__FILE__)?>';
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
              channelUrl : '//playarmeria.com/channel.html', // Channel File
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
        <div id="itemTooltipBox"></div>
        <div id="wrapSidebar">
            <div id="frameLogo">Logo</div>
            <div id="outerFramePlayerList">
                <div id="framePlayerList">
                    <ul id="playerList"></ul>
                </div>
            </div>
            <div id="outerFrameStats">
                <div id="frameStats">
                    <table id="playerStats" cellpadding="3" cellspacing="3">
                        <tr>
                            <td><span class="statName">Strength</span><br/><span class="statData">0</span></td>
                            <td><span class="statName">P Damage</span><br/><span class="statData">0</span></td>
                        </tr>
                        <tr>
                            <td><span class="statName">Intelligence</span><br/><span class="statData">0</span></td>
                            <td><span class="statName">M Damage</span><br/><span class="statData">0</span></td>
                        </tr>
                        <tr>
                            <td><span class="statName">Charisma</span><br/><span class="statData">0</span></td>
                            <td><span class="statName">Resistance</span><br/><span class="statData">0</span></td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
        <div id="wrapGameArea">
            <div id="outerFrameGame">
                <div id="innerFrameGame">
                    <div id="frameGame">
                        
                    </div>
                    <div id="frameGameMap">
                        <div id="gameMap">
                            <canvas id="gameMapCanvas" width="240px" height="240px"></canvas>
                            <div id="playerMark"></div>
                            <div id="mapShadow"></div>
                        </div>
                        <p id="mapName"></p>
                    </div>
                    
                </div>
            </div>
            <div id="outerFrameInput">
                <div id="frameInput">
                    <div id="playerVitals">
                        <table border="0" frame="void" id="playerVitalsTable">
                           <tr>
                               <td>
                                    <div id="barHealth" class="bar health"></div>
                                    <div class="barText">Health: 0 / 0</div>
                                </td>
                               <td>
                                    <div id="barMagic" class="bar magic"></div>
                                    <div class="barText">Magic: 0 / 0</div>
                                </td>
                               <td>
                                    <div id="barEnergy" class="bar energy"></div>
                                    <div class="barText">Energy: 0 / 0</div>
                                </td>
                               <td>
                                    <div id="barExp" class="bar exp"></div>
                                    <div class="barText">Exp: 0 / 0</div>
                                </td>
                           </tr>
                        </table>
                    </div>
                    <input type="text" id="inputGameCommands" placeholder="Type commands here.."/>
                </div>
            </div>
        </div>
    </body>
</html>
