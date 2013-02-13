<!DOCTYPE html>
<?php
    // port
    $port = file_get_contents('./port');
?>
<html lang="en">
    <head>
        <title>Armeria: Social MUD v2</title>
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


                // div hiding defaults
                $('div.showhide,#left-content-show').hide();

                // hide left-content
                $('#left-content-hide').click(function(){
                  $('div.showhide,#left-content-hide').hide();
                  $('div.showhide,#left-content').hide();
                  $('div.showhide,#left-content-show').show();
                  $("#right-content").css({"left":"0"});
                  $("#logo").css({"display":"none"});
                });

                // show left-content
                $('#left-content-show').click(function(){
                  $('div.showhide,#left-content-show').hide();
                  $('div.showhide,#left-content').show();
                  $('div.showhide,#left-content-hide').show();
                  $("#right-content").css({"left":"208px"});
                  $("#logo").css({"display":"block"});
                });
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
        <div id="itemtooltip-container"></div>
        <div id="left-content-hide"></div>
        <div id="left-content-show"></div>
        <div id="minimap-toggle"></div>
        <div id="logo"></div>
        <div id="left-content">
            <div id="roomlist-container">
                <ul id="roomlist"></ul>
            </div>
            <div id="score">
              <table id="score-table" border="1" width="100%" cellpadding="3" cellspacing="3">
                <tr>
                  <td id="raceclass" colspan="2">Human Novice</td>
                </tr>
                <tr>
                  <td class="score-property">Level:</td>
                  <td id="level" class="score-value">0</td>
                </tr>
                <tr>
                  <td class="score-property">Armor:</td>
                  <td id="armor" class="score-value">0</td>
                </tr>
                <tr>
                  <td class="score-property">Strength:</td>
                  <td id="strength" class="score-value">0</td>
                </tr>
                <tr>
                  <td class="score-property">Intelligence:</td>
                  <td id="intelligence" class="score-value">0</td>
                </tr>
                <tr>
                  <td class="score-property">Charisma:</td>
                  <td id="charisma" class="score-value">0</td>
                </tr>
                <tr>
                  <td class="score-property">P. Damage:</td>
                  <td id="physicaldamage" class="score-value">0</td>
                </tr>
                <tr>
                  <td class="score-property">M. Damage:</td>
                  <td id="magicaldamage" class="score-value">0</td>
                </tr>
                <tr>
                  <td class="score-property">Resistance:</td>
                  <td id="resistance" class="score-value">0</td>
                </tr>
              </table>
            </div>
        </div>
        <div id="right-content">
            <div id="game"></div>
                <div id="minimap">
                    <canvas id="map-canvas" width="240" height="240"></canvas>
                    <div id="player"></div>
                    <div id="mapshadow"></div>
                    <div id="mapname"><p id="mapname-p">Test Area</p></div>
                </div>
                
                <div id="playervitals-container">
                  <div class="bar">
                    <div class="bar-border">
                      <div id="bar-health" class="bar-color"></div>
                      <div id="text-health" class="bar-shadow">100 / 100</div>
                    </div>
                  </div>
                  <div class="bar">
                    <div class="bar-border">
                      <div id="bar-magic" class="bar-color"></div>
                      <div id="text-magic" class="bar-shadow">100 / 100</div>
                    </div>
                  </div>
                  <div class="bar">
                    <div class="bar-border">
                      <div id="bar-energy" class="bar-color"></div>
                      <div id="text-energy" class="bar-shadow">100 / 100</div>
                    </div>
                  </div>
                  <div class="bar">
                    <div class="bar-border">
                      <div id="bar-exp" class="bar-color"></div>
                      <div id="text-exp" class="bar-shadow">100 / 100</div>
                    </div>
                  </div>
            </div>
        </div>
        <div id="bottom-content">
            <div id="input-container"><input type="text" id="input" placeholder="Type commands here.."/></div>
            <div id="defaultchannel">
                <select id="defaultchannel-select" dir="rtl" disabled="disabled">
                  <option value="say ">:Say</option>
                  <option value="builder ">:Builder</option>
                  <option value="gossip ">:Gossip</option>
                  <option value="reply ">:Reply</option>
                </select>
            </div>
            <div id="buttons">
              <button type="north" value="N">N</button>
              <button type="east" value="E"/>E</button>
              <button type="south" value="S"/>S</button>
              <button type="west" value="W"/>W</button>
            </div>
        </div>
    </body>
</html>
