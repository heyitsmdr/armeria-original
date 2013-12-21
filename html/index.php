<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Armeria: Social MUD</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>

        <meta name="apple-mobile-web-app-capable" content="yes" />

        <link rel="apple-touch-icon" sizes="57x57" href="57.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="72.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="114.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="144.png" />
        <!-- iOS Device Startup Images -->
        <!-- iPhone/iPod Touch Portrait – 320 x 460 (standard resolution) -->
        <link rel="apple-touch-startup-image" href="320x460.png" media="screen and (max-device-width: 320px)" />

        <!-- iPhone/iPod Touch Portrait – 640 x 920 pixels (high-resolution) -->
        <link rel="apple-touch-startup-image" media="(max-device-width: 480px) and (-webkit-min-device-pixel-ratio: 2)" href="640x920.png" />

        <!-- For iPad Landscape 1024x748 -->
          <!-- Note: iPad landscape startup image has to be exactly 748x1024 pixels (portrait, with contents rotated).-->
        <link rel="apple-touch-startup-image" sizes="1024x748" href="1024x748.png" media="screen and (min-device-width: 481px) and (max-device-width: 1024px) and (orientation:landscape)" />

        <!-- For iPad Portrait 768x1004 -->
        <link rel="apple-touch-startup-image" sizes="768x1004" href="768x1004.png" media="screen and (min-device-width: 481px) and (max-device-width: 1024px) and (orientation:portrait)"/>

        <!-- Stylesheets -->
        <link id="cssReset" rel="stylesheet" type="text/css" href="css/reset.css">
        
        <!-- LESS -->
        <link rel="stylesheet/less" type="text/css" href="css/style.less" />
        <script>
          less = {
            env: "development"
          };
        </script>
        <script src="./css/less-1.3.3.min.js" type="text/javascript"></script>

        <link rel="stylesheet" type="text/css" href="libraries/gritter/css/jquery.gritter.css">
        <link href='http://fonts.googleapis.com/css?family=Open+Sans:400italic,600italic,700italic,800italic,400,800,700,600' rel='stylesheet' type='text/css'>
        <!-- Scripts -->
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
        <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js"></script>
        <script src="engine.js?buildTime=<?=filemtime('./engine.js')?>"></script>
        <script src="libraries/soundmanager2/js/soundmanager2.js"></script>
        <script type="text/javascript" src="libraries/gritter/js/jquery.gritter.js"></script>

        <script type="text/javascript">
          var serverHost = location.hostname;
          if(location.hostname == 'armeria.ngrok.com') { serverHost = "armeria-serv.ngrok.com"; }
          var socketJs = document.createElement('script');
          socketJs.setAttribute('type','text/javascript');
          socketJs.setAttribute('src', 'http://' + serverHost + ':2772/socket.io/socket.io.js');
          if(socketJs) {
            document.getElementsByTagName('head')[0].appendChild(socketJs);
          }
        </script>
        <script type="text/javascript">
            $(document).ready(function(){
                GameEngine.init();
                GameEngine.version = '<?=filemtime(__FILE__)?>';

                // div hiding defaults
                $('div.showhide,#left-content-show').hide();
                $('div.showhide,#minimap-show').hide();

                // hide left-content
                $('#left-content-hide').click(function(){
                  $('div.showhide,#left-content-hide').hide();
                  $('div.showhide,#left-content').hide(200, function(){$('div.showhide,#left-content-show').fadeIn(300);});
                  $("#right-content").animate({left:"0"}, 200);
                  //$("#logo").css({"display":"none"});
                  $('div.showhide,#logo').fadeOut(200);
                });

                // show left-content
                $('#left-content-show').click(function(){
                  $('div.showhide,#left-content-show').hide();
                  $('div.showhide,#left-content').show(200, function(){$('div.showhide,#left-content-hide').fadeIn(300);});
                  $("#right-content").animate({left:"208px"}, 200);
                  //$("#logo").css({"display":"block"});
                  $('div.showhide,#logo').fadeIn(200);
                });

                //hide minimap
                $('#minimap-hide').click(function(){
                  $('div.showhide,#minimap-hide').hide();
                  $('div.showhide,#minimap').hide(200, function(){$('div.showhide,#minimap-show').fadeIn(300);});
                });

                //show minimap
                $('#minimap-show').click(function(){
                  $('div.showhide,#minimap-show').hide();
                  $('div.showhide,#minimap').show(200, function(){$('div.showhide,#minimap-hide').fadeIn(300);});
                });
            });
        </script>
    </head>
    <body oncontextmenu="return false">
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
        <div id="minimap-hide"></div>
        <div id="minimap-show"><p>Show Minimap</p></div>
        <div id="right-content">
            <div id="game"></div>
                <div id="minimap">
                    <canvas id="map-canvas" width="256" height="256"></canvas>
                    <div id="player"></div>
                    <div id="mapshadow"></div>
                    <div id="playerMark"></div>
                    <div id="mapname"><p id="mapname-p">-</p></div>
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

        <!-- Editor -->
        <div id="editor-container">
          <div id="editor-map">
            <table width="100%" height="100%">
              <tr>
                <td align="center" style="vertical-align:middle;">
                  <div id="editor-grids"></div>
                </td>
              </tr>
            </table>
          </div>
          <div id="editor-properties">
            <!-- Builder Properties -->
            <div class="prop-cat">
              Builder Settings
            </div>
            <div class="prop-set">
              <div class="prop-name">Canvas Size</div>
              <div class="prop-value"><a href="#" id="builder-size">16x16</a></div>
            </div>
            <div class="prop-set">
              <div class="prop-name">Default Terrain</div>
              <div class="prop-value"><a href="#" id="builder-terrain" onclick="GameEngine.editorToggleExtra('builder-terrain-extra')">null null</a></div>
            </div>
            <div class="prop-extra" id="builder-terrain-extra">
              <strong>Base:</strong>&nbsp;<select id="builder-terrain-base" onchange="GameEngine.editorSetDefaultTerrain()"></select><br />
              <strong>Primary:</strong>&nbsp;<select id="builder-terrain-primary" onchange="GameEngine.editorSetDefaultTerrain()"></select>
            </div>
            <div class="prop-set">
              <div class="prop-name">Click Action</div>
              <div class="prop-value"><a href="#" id="builder-clickaction" onclick="GameEngine.editorChangeClickAction()">teleport</a></div>
            </div>
            <!-- Area Properties -->
            <div class="prop-cat">
              Map Properties
            </div>
            <div class="prop-set">
              <div class="prop-name">Map Name</div>
              <div class="prop-value"><a href="#" id="map-name">..</a></div>
            </div>
            <div class="prop-set">
              <div class="prop-name">Creator</div>
              <div class="prop-value" id="map-author">..</div>
            </div>

            <!-- Selected Room Properties -->
            <div class="prop-cat" id="section-roomprops">
              Current Room Properties
            </div>
            <div class="prop-set">
              <div class="prop-name">Name</div>
              <div class="prop-value"><a href="#" id="room-name" onclick="GameEngine.editorEditProperty(this)">..</a></div>
            </div>
            <div class="prop-set">
              <div class="prop-name">Description</div>
              <div class="prop-value"><a href="#" id="room-desc" onclick="GameEngine.editorEditProperty(this)">..</a></div>
            </div>
            <div class="prop-set">
              <div class="prop-name">Terrain</div>
              <div class="prop-value"><a href="#" onclick="GameEngine.editorToggleExtra('terrain-extra')" id="room-terrain">..</a></div>
            </div>
            <div class="prop-extra" id="terrain-extra">
              <strong>Base:</strong>&nbsp;<select id="room-terrain-base" onchange="GameEngine.editorSetTerrain()"></select><br />
              <strong>Primary:</strong>&nbsp;<select id="room-terrain-primary" onchange="GameEngine.editorSetTerrain()"></select><br />
              <strong>Sides:</strong><br />
              &nbsp;&nbsp;Top: <input type="checkbox"  onclick="GameEngine.editorSetTerrain()" id="room-terrain-corners-t" />&nbsp;&nbsp;Right: <input type="checkbox"  onclick="GameEngine.editorSetTerrain()" id="room-terrain-corners-r" />&nbsp;&nbsp;Bottom: <input type="checkbox"  onclick="GameEngine.editorSetTerrain()" id="room-terrain-corners-b" />&nbsp;&nbsp;Left: <input type="checkbox"  onclick="GameEngine.editorSetTerrain()" id="room-terrain-corners-l" /><br />
              <strong>Corners:</strong><br />
              &nbsp;&nbsp;TL: <input type="checkbox" onclick="GameEngine.editorSetTerrain()" id="room-terrain-corners-tl" />&nbsp;&nbsp;TR: <input type="checkbox"  onclick="GameEngine.editorSetTerrain()" id="room-terrain-corners-tr" />&nbsp;&nbsp;BR: <input type="checkbox"  onclick="GameEngine.editorSetTerrain()" id="room-terrain-corners-br" />&nbsp;&nbsp;BL: <input type="checkbox"  onclick="GameEngine.editorSetTerrain()" id="room-terrain-corners-bl" /><br />
            </div>
            <div class="prop-set">
              <div class="prop-name">Environment</div>
              <div class="prop-value"><a href="#" id="room-environment" onclick="GameEngine.editorEditProperty(this)">..</a></div>
            </div>

          </div>
        </div>
    </body>
</html>
