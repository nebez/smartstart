/*
Copyright 2014 Nebez Briefkani

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

NOTE: This project is a pretty huge mess. I comment on a lot of my work, but I never expected people to actually want this.
I apologize for the mess, but I really hope you guys can do something awesome with it!
*/


/////////////////////////////////////////////
//Main
/////////////////////////////////////////////

//On doc ready
$(document).ready(function(){
   //Load up all our settings from localStorage for every box
   $(".box").each(function() {
      loadSettings($(this).attr("id"));
      //Sometimes the settings don't exist in localStorage, so we should probably save them
      saveSettings($(this).attr("id"), false);
   });

    //Display our date & time, and greeting right away (they are only updated once every 10 seconds, need instant display)
   updateDateTime();

   //Re-arrange our tiles if necessary
   reArrangeTiles();

   //Init our edit tooltips and handle their clicks
   $(".edit a").tooltip();

   //Populate our tile color selectors
   populateTileColorSelectors();

   //Show project info dialog... maybe?
   showProjectInfo();

   //Finally, Focus the search box
   $("#searchbox").focus();
});

function showProjectInfo()
{
   if(window.location.host.toLowerCase().indexOf("nebezb.com") != -1)
   {
      //They're at nebezb.com, show them an alert.
      var alerthtml = '<div class="alert alert-info alert-dismissable">';
      alerthtml += '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
      alerthtml += '<h2>Hey there!</h2><p>Thanks for checking out the SmartStart project. This is only a live preview, and not meant to be used as your actual homepage.</p>';
      alerthtml += '<p>You can <a href="https://github.com/nebez/smartstart/archive/gh-pages.zip" class="alert-link">download this project here</a>, or check out the <a href="https://github.com/nebez/smartstart" class="alert-link">GitHub repo here</a>, or use <a href="http://nebez.github.io/smartstart/" class="alert-link">this live preview</a> instead, hosted by GitHub, which will always be kept updated automatically.</p>';
      alerthtml += '<p>Sorry for having to create this huge alert. You can close it (hit the X). Unfortunately, I need to show it. The project is meant to be downloaded and run locally, and I don\'t have the server power to host this for hundreds of users.</p>';
      alerthtml += '</div>';
      $(".container").prepend(alerthtml);
   }
}


/////////////////////////////////////////////
//Settings
/////////////////////////////////////////////

//Load user settings
function loadSettings(tile)
{
   //Sanity check, make sure there's no # in front
   if(tile.charAt(0) == "#")
      tile = tile.substr(1);

   //Can we access localStorage?
   if(typeof(Storage)!=="undefined" && window.localStorage != null)
   {
      //Does this tile exist?
      var tileelement = $("#"+ tile +".box");
      if(tileelement.length == 0)
      {
         //NO! Throw an error
         throw(tile + ".box doesn't exist! (load)");
      }
      else
      {
         //Find all the data this element requires, and load it from localStorage
         for (d in tileelement.data())
         {
            //Do we have anything in localStorage for this?
            if(localStorage[tile + "-" + d] !== null)
            {
               //Load it up with both data() and attr() (just in case, seems like a weird jQuery thing where attr(data-*) doesn't update data(*) and vice versa)
               tileelement.data(d, localStorage[tile + "-" + d]);
               tileelement.attr("data-" + d, localStorage[tile + "-" + d]);

               //Populate the input fields (format: #boxname-inputname, ex: weather-units)
               $("#" + tile + "-" + d).val(tileelement.attr("data-" + d));
               //console.log("Loading [" + tile + "-" + d + "] = " + tileelement.attr("data-" + d));
            }
         }
      }
   }
   else
   {
      //Nope... can't load from localStorage.
      //Should we tell them ? :(
   }

   //Let's load up some of the more specific settings (aside from tileColor, it's handled in reColorTiles())
   switch(tile.toLowerCase())
   {
      case "greeting":
         //Greet them by name :D
         $("#greeting #name").text($("#greeting").data("fullname"));
         break;
      case "weather":
         //Reload weather info!
         getWeather($("#weather").data("location"), $("#weather").data("units"));
         break;
      case "reddit":
         //Reload reddit info
         getRedditPosts($("#reddit").data("subreddit"), $("#reddit").data("numposts"));
         break;
      case "bookmarks":
         //Reload view and edit side of favorites
         populateBookmarks($("#bookmarks").data("encodedbookmarks"));
         break;
      default:
         //console.log("unhandled switch: " + tile);
   }

   //Color all the tiles based on data-tilecolor
   reColorTiles();
}

//Save user settings for a specific tile
function saveSettings(tile, alert)
{
   //Sanity check, make sure there's no # in front
   if(tile.charAt(0) == "#")
      tile = tile.substr(1);

   //Can we access localStorage?
   if(typeof(Storage)!=="undefined" && window.localStorage != null)
   {
      //We can use localStorage! Let's store this ish
      //Does this tile exist?
      var tileelement = $("#"+ tile +".box");
      if(tileelement.length == 0)
      {
         //NO! Throw an error
         throw(tile + ".box doesn't exist! (save)");
      }
      else
      {
         //find all the data settings associated with it and store it in localStorage
         for (d in tileelement.data())
         {
            //Move all of the input values into the data fields for saving
            tileelement.attr("data-" + d, $("#" + tile + "-" + d).val());
            tileelement.data(d, $("#" + tile + "-" + d).val());

            //Save it!
            localStorage[tile + "-" + d] = tileelement.data(d);
            //console.log("Saving [" + tile + "-" + d + "] = " + tileelement.attr("data-" + d));
         }
      }
   }
   else
   {
      //No localStorage :'( They can't save anything... should we alert them?
      if(alert)
      {
         //Show an alert at the beginning of the container. Suggest modifying the data- attributes themselves, that could work!
         var alerthtml = '<div class="alert alert-danger alert-dismissable">';
         alerthtml += '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
         alerthtml += '<h2>Whoa, there!</h2><p>Your browser doesn\'t seem to have <a href="http://www.w3schools.com/html/html5_webstorage.asp" class="alert-link">HTML5 Web Storage</a> capability! All changes made can\'t be saved.</p>';
         alerthtml += '<p>Instead, you should manually open this file (index.html), edit all the data tags marked by the comments, save it and try again!</p>';
         alerthtml += "<p>Note: Internet Explorer doesn't allow access to localStorage through the file: protocol. If this is the case, consider hosting this either locally or remotely and accessing it via the http: protocol</p>";
         alerthtml += '</div>';
         $(".container").prepend(alerthtml);
      }
   }
}


/////////////////////////////////////////////
//Helpers/Misc
/////////////////////////////////////////////

//On window resize, re-arrange tiles if necessary (mobile/tablet places search bar in second slot)
$( window ).resize(function() {
   reArrangeTiles();
});

//Function to re-arrange tiles based on window size (namely: <992px).
//Extremely hackish. Moves tiles around based on fixed positions. Fix this.
function reArrangeTiles()
{
   //Note: focus is lost during reArrangeTiles function. We need to try to keep it
   var focused = false;

   //We re-arrange tiles based on viewport. On small devices (< 992 px), it goes: greeting, search, time, temperature
   if(viewport().width < 992)
   {
      //We're in small viewport mode! Re-arrange if it hasn't already been re-arranged (aka: search is in spot: 4)
      if($(".box").eq(3).attr("id") == "search")
      {
         //Before any moving, should we re-focus after search?
         focused = $("#searchbox").is(":focus");

         //Move time to the front
         $(".box").eq(2).parent().insertBefore($(".box").eq(0).parent());
         //Now move search to the front
         $(".box").eq(3).parent().insertBefore($(".box").eq(0).parent());
         //Finally, move greet to the front
         $(".box").eq(3).parent().insertBefore($(".box").eq(0).parent());
      }
   }
   else
   {
      //We're in normal viewport. Do we need to re-arrange (is search in spot 2)?
      if($(".box").eq(1).attr("id") == "search")
      {
         //Before any moving, should we re-focus after search?
         focused = $("#searchbox").is(":focus")

         //Yes! Let's move temperature to the front
         $(".box").eq(3).parent().insertBefore($(".box").eq(0).parent());
         //Now the time before search
         $(".box").eq(3).parent().insertBefore($(".box").eq(2).parent());
      }
   }

   if(focused)
      $("#searchbox").focus();
}

//Get viewport size
function viewport() {
    var e = window, a = 'inner';
    if (!('innerWidth' in window )) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return { width : e[ a+'Width' ] , height : e[ a+'Height' ] };
}

//jQuery CSS hook to return background-color in HEX and not RGB for comparison
$.cssHooks.backgroundColor = {
    get: function(elem) {
        if (elem.currentStyle)
            var bg = elem.currentStyle["backgroundColor"];
        else if (window.getComputedStyle)
            var bg = document.defaultView.getComputedStyle(elem,
                null).getPropertyValue("background-color");
        if (bg.search("rgb") == -1)
            return bg;
        else {
            bg = bg.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            function hex(x) {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }
            return "#" + hex(bg[1]) + hex(bg[2]) + hex(bg[3]);
        }
    }
}


/////////////////////////////////////////////
//Edit/Configuration
/////////////////////////////////////////////

//Bind functions to edit/configuration anchor click
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
   //When they click the edit button, we need to switch its target back to view (and vice-versa)
   //On edit click
   if(e.target.hash.substr(e.target.hash.length - 4) == "edit")
   {
      //Swap back to view mode on next click
      e.target.href = e.target.href.replace("edit", "view");

      //And a little special something for the bookmarks edit (we handle this one differently... it gets ugly)
      if($(this).parents(".box").attr("id") == "bookmarks")
         editBookmarks();
   }
   //On view click
   else
   {
      //Swap back to edit mode on next click
      e.target.href = e.target.href.replace("view", "edit");

      //Load settings (if they've saved, new settings will be loaded. if they've discarded, old settings will be loaded. hayo!)
      var thisid = $(this).parents(".box").attr("id");
      loadSettings(thisid);
   }

   //Re-activate the currently selected tile colors
   activateUsedTileColors();
});

//On configuration save
$("button.save").click(function() {
   //Save!
   var thisid = $(this).parents(".box").attr("id");
   saveSettings(thisid, true);

   //Click the edit button to toggle us, the toggle handler will take care of re-loading
   $(this).parents(".box").children(".edit").children("a").tab("show");
});

//On configuration cancel
$("button.cancel").click(function() {
   //Click the edit button to toggle us, the toggle handler will take care of re-loading
   $(this).parents(".box").children(".edit").children("a").tab("show");
});


/////////////////////////////////////////////
//Date/Time
/////////////////////////////////////////////

//Function to display date, time, and greeting
function updateDateTime()
{
   $("#datetime #time").text(moment().format("h.mm a"));
   $("#datetime #date").text(moment().format("dddd, MMMM Do"));
   $("#greeting #greet").text(getGreeting());
}

//Get a greeting based on time of day
function getGreeting()
{
   var hournow = parseInt(moment().format("HH")); //24 hour format
   //5am to 12pm = good morning
   if(hournow >= 5 && hournow <= 12)
      return "Good Morning,";
   //1pm to 7pm = good afternoon
   else if(hournow >= 13 && hournow <= 18)
      return "Good Afternoon,";
   //8pm to 4am = good evening
   else
      return "Good Evening,";
}

//Our date and time loop, executed every 10 seconds
dateTimeLoop=setInterval(function() {
   updateDateTime();
}, 10000);


/////////////////////////////////////////////
//Tile Coloring
/////////////////////////////////////////////

//Function to color all the tiles based on their data-tilecolor attribute
function reColorTiles()
{
   //recolor anything that is .colorable
   $(".colorable").each(function() {
      //find the new color to apply
      var newcolor;

      if($(this).attr("data-tilecolor") != null)
         newcolor = $(this).attr("data-tilecolor");
      else
         newcolor = $(this).parents(".box").attr("data-tilecolor");

      //apply it to the specified css style
      $(this).css($(this).attr("data-colorable"), newcolor);
   });
}

//Populate the tile color picker
function populateTileColorSelectors()
{
   //List of colors to use!
   var colors = [ "#659fd1", "#76b7ee", "#76c8ee", "#76e1ee", "#68ded7", "#57dcbb", "#58d0a1", "#5fc878", "#65b676", "#8cc76f", "#add36c", "#dad276", "#e8c883", "#eeaf5c", "#d48964", "#e16161", "#e38ea4", "#e080b4", "#df60a5", "#ec5dd3", "#b469cd", "#b68ee3", "#c35993", "#8d59c3" ];
   //enumerate all the colors
   for(var i = 0; i < colors.length; ++i)
   {
      //append to every tilecolorselector there is
      $(".tilecolorselector").append('<a href="#" class="tilecolor" style="background-color: ' + colors[i] + ';"></a>');
   }

   //Activate all the tilecolor's that are currently being used
   activateUsedTileColors();
}

//Function to activate (by adding class .active) all the tilecolor's that are currently being used
function activateUsedTileColors()
{
   //Filter by parent boxes data tile color and add active class
   $(".tilecolorselector").children().removeClass("active");
   $(".tilecolorselector").children().filter(function() { return $(this).css('background-color').toLowerCase() == $(this).parents(".box").attr("data-tilecolor").toLowerCase(); }).addClass("active");
}

//Handle the color picker anchor clicks
$(".tilecolorselector").on("click", "a", function(e) {
   //Deactivate old tile and activate this one instead
   $(this).parent().children("a.tilecolor").removeClass("active");
   $(this).addClass("active");

   //Update the color live! Set tilecolor data and reColor
   var newcolor = $(this).css("background-color");
   $(this).parents(".box").attr("data-tilecolor", newcolor);
   $(this).parents(".box").data("tilecolor", newcolor);
   reColorTiles();

   e.preventDefault();
});

//On form control focus (recolor to match data-tilecolor of parent)
//Super hackish, but more than one property (and prefixes!) needs recoloring and it can't be handled by one single data-colorable attribute
$(".form-control").focus(function() {
   var newcolor = $(this).parents(".box").attr("data-tilecolor");
   $(this).css("border-color", newcolor);
   $(this).css("-webkit-box-shadow",  "inset 0 1px 1px rgba(0,0,0,0.075),0 0 8px " + newcolor);
   $(this).css("box-shadow",  "inset 0 1px 1px rgba(0,0,0,0.075),0 0 8px " + newcolor);
});

//On form control focus loss (remove coloring and shadow)
//Super hackish, but more than one property (and prefixes!) needs recoloring and it can't be handled by one single data-colorable attribute
$(".form-control").focusout(function() {
   var newcolor = $(this).parents(".box").attr("data-tilecolor");
   $(this).css("border-color", "");
   $(this).css("-webkit-box-shadow",  "");
   $(this).css("box-shadow",  "");
});


/////////////////////////////////////////////
//Search box
/////////////////////////////////////////////

//On pressing enter while searching
$("#searchbox").keypress(function(e) {
   //Make sure they've pressed enter
   if(e.which != 13)
      return;
   //Which search engine are we using?
   var engine = $("#search").attr("data-searchengine");
   var input = $("#searchbox").val();
   var query;
   if(engine == "google")
      query = "http://google.com/search?q=" + input;
   if(engine == "yahoo")
      query = "http://search.yahoo.com/search?p=" + input;
   if(engine == "bing")
      query = "http://bing.com/search?q=" + input;
   if(engine == "duckduckgo")
      query = "http://duckduckgo.com/?q=" + input;

   window.location.href = query;
});


/////////////////////////////////////////////
//Reddit
/////////////////////////////////////////////

function ajaxDidError(statusCode, errorThrown) {
     if (statusCode.status == 0) {
         // user is offline, hide loader animations
         $(".loader").hide();
         $("#subname").html("<small>You are offline</small>").show();
         $("#weatherview h1").html("<small>You are offline</small>").show();
         $("#weatherview h4").hide();
     }
 }

function getRedditPosts(subreddit, postlimit)
{
   //Show the loader until we can get the data
   $("#redditposts").hide();
   $("#reddit .loader").show();

   //Title
   $("#subname").text(subreddit);

   //Get the reddit posts!
   //http://www.reddit.com/r/pathofexile.json?limit=5&jsonp=none
   var apiurl = "http://reddit.com"+subreddit+".json?limit="+postlimit+"&jsonp=?";
   var jqxhr = $.ajax({type: 'GET', error:ajaxDidError, timeout: 8000, url: apiurl, async: true, contentType: 'application/json', jsonpCallback: 'jsonp', dataType: 'jsonp', cache: true })
      .done(function(json) {
         //We're good! Assemble the list of reddit posts
         //Empty it out first just in case
         $("#redditposts").children("tbody").empty()

         //Time to populate
         for(var i = 0; i < json.data.children.length; i++)
         {
            var posthtml = '<tr><td class="colorable rating text-center" data-colorable="color"><a href="http://reddit.com'+json.data.children[i].data.permalink+'" data-toggle="tooltip" data-placement="bottom" title="View Comments" class="commentanchor">'+json.data.children[i].data.score+'</a></td><td><a href="'+json.data.children[i].data.url+'">'+json.data.children[i].data.title+'</a></td></tr>';
            $("#redditposts").children("tbody").append(posthtml);
         }

         //Init the tooltips
         $(".commentanchor").tooltip();

         //Show the posts and hide the loader
         $("#reddit .loader").hide();
         $("#redditposts").show();
      })
      .fail(function() {
         console.error( jqxhr );
      })
      .always(function() {
         //console.log( "complete getRedditPosts" );
      });
}


/////////////////////////////////////////////
//Weather
/////////////////////////////////////////////

function getWeather(location,units)
{
   //Show the loader and hide the rest until we can get the data
   $("#weatherview h1").hide();
   $("#weatherview h4").hide();
   $("#weatherview .loader").show();

   //Go for it
   var apiurl = "http://api.openweathermap.org/data/2.5/weather?q="+location+"&units="+units+"&callback=?";
   var jqxhr = $.ajax({type: 'GET', error:ajaxDidError, timeout: 8000, url: apiurl, async: true, contentType: 'application/json', jsonpCallback: 'callbackweather', dataType: 'jsonp', cache: true })
      .done(function(json) {
         //We're good! return the temperature and conditions
         var temp = null;
         if(units == "metric")
            temp = json.main.temp.toFixed(1) + "&deg;c";
         else
            temp = json.main.temp.toFixed(0) + "&deg;f";

         var condition = "";
         for(var i=0; i<json.weather.length; i++)
         {
            //Loop through all conditions and put them together
            var newcondition = parseWeatherCondition(json.weather[i].id);
            condition += newcondition;

            //log if newcondition is blank
            if(newcondition == "")
               console.error("Unhandled weather condition: " + JSON.stringify(json.weather[i]));

            //add commas where necessary
            if(i + 1 < json.weather.length)
               condition += ", ";
         }

         //update the weather tile!
         $("#weather #temperature").html(temp);
         $("#weather #condition").text(condition);

         //Show us!
         $("#weatherview .loader").hide();
         $("#weatherview h1").show();
         $("#weatherview h4").show();
      })
      .fail(function() {
         console.error( jqxhr );
      })
      .always(function() {
         //console.log( "complete getWeather" );
      });
}

function parseWeatherCondition(condition)
{
   //http://openweathermap.org/wiki/API/Weather_Condition_Codes
   if(condition == 200 || condition == 201 || condition == 202 || condition == 230 || condition == 231 || condition == 232)
      return "Thunderstorm & Rainy";
   if(condition == 210 || condition == 211 || condition == 221)
      return "Thunderstorm";
   if(condition == 212)
      return "Heavy Thunderstorm";

   if(condition >= 300 && condition <= 321)
      return "Drizzle";

   if(condition == 500 || condition == 501 || condition == 520)
      return "Rainy";
   if(condition == 502 || condition == 503 || condition == 504 || condition == 521 || condition == 522)
      return "Heavy Rain";
   if(condition == 504)
      return "Freezing Rain";

   if(condition == 600 || condition == 620)
      return "Light Snow";
   if(condition == 601 || condition == 611 || condition == 621)
      return "Snowy";
   if(condition == 602)
      return "Heavy Snow";

   if(condition >= 701 && condition <= 741)
      return "Foggy";

   if(condition == 800)
      return "Clear Skies";
   if(condition == 801)
      return "Slightly Cloudy";
   if(condition == 802 || condition == 803)
      return "Cloudy";
   if(condition == 804)
      return "Overcast";

   if(condition == 900)
      return "Tornado";
   if(condition == 901)
      return "Tropical Storm";
   if(condition == 902)
      return "Hurricane";
   if(condition == 903)
      return "Extreme Cold";
   if(condition == 904)
      return "Extreme Heat";
   if(condition == 905)
      return "Extreme Wind";
   if(condition == 906)
      return "Extreme Hail";

   //If all else fails...
   return "";
}


/////////////////////////////////////////////
//Bookmarks
/////////////////////////////////////////////
function populateBookmarks(b64favs)
{
   //Decode the favorites back into json
   var favs = $.parseJSON(Base64.decode(b64favs));

   //Clear the current content just in case
   $("#bookmarks").children(".content").children(".inner").children("ul").empty();

   //Populate it back up again
   $("#bookmarkcount").text(favs.bookmarks.length + " Sites Bookmarked");
   for(var i = 0; i < favs.bookmarks.length; i++)
   {
      var favhtml = '<li class="colorable" data-colorable="background-color"><a href="'+favs.bookmarks[i].url+'" class="editfav">'+favs.bookmarks[i].title+'</a></li>';
      $("#bookmarks").children(".content").children(".inner").children("ul").append(favhtml);
   }

   //Make them sortable (we must do this every time bookmarks are populated since new DOM elements are being created each time)
   $("#bookmarks .inner ul").sortable({
      start: function(e, ui ){
         //Set the height to 0
         ui.placeholder.height(0);
      },

      //Whenever we're updated/moved/etc, call updateBookmarks to replicate the changes in the back end
      update: function(e, ui) {
         updateBookmarks();
      }
   });

   //Disable sortability
   $("#bookmarks .inner ul").sortable("disable");
}

function editBookmarks()
{
   //Add a + button to the inner content
   var addhtml = '<li class="colorable" data-colorable="background-color" ><a href="#" class="addfav">+</a></li>';
   $("#bookmarks").children(".content").children(".inner").children("ul").append(addhtml);

   //We have to recolor here or the + button won't show
   reColorTiles();

   //Make us sortable!
   $("#bookmarks .inner ul").sortable("enable");
}

//On bookmark anchor click
$("#bookmarks").children(".content").children(".inner").children("ul").on("click", "a", function(e) {
   //Are we in edit mode? (Hackish way, we check if addfav class exists
   if($(".addfav")[0])
   {
      //Yes! Did they click on add?
      if($(this).hasClass("addfav"))
      {
         //Show them an add modal
         showAddModal();
      }
      else
      {
         //Must have been an edit :o
         showEditModal($(e.target));
      }
      //Prevent the default link event
      e.preventDefault();
   }
});

function showAddModal()
{
   //Clear the inputs, hide errors and show it!
   $("#addbookmarkmodal input").val("");
   $(".blankalert").hide();
   $("#addbookmarkmodal").modal();
}

//Handle the save button of add model
$("#addbookmarksave").click(function() {
   //Did they leave any fields blank?
   if($("#addbookmarkmodal #addbookmarktitle").val().trim().length == 0 || $("#addbookmarkmodal #addbookmarkurl").val().trim().length == 0)
   {
      //They've left a field blank
      $(".blankalert").show();
      return false;
   }
   //Add a new bookmark
   var favhtml = '<li class="colorable" data-colorable="background-color"><a href="'+ $("#addbookmarkurl").val() +'" class="editfav">'+ $("#addbookmarktitle").val() +'</a></li>';
   $("#bookmarks").children(".content").children(".inner").children("ul").append(favhtml);

   //Now move the + button back to the end
   $("#bookmarks .content .inner ul li:last").insertAfter($("#bookmarks .content .inner ul li").eq($("#bookmarks .content .inner ul li").length - 3));

   //recolor tiles (again) :(
   reColorTiles();

   //Now hide the modal up again
   $("#addbookmarkmodal").modal("hide");

   updateBookmarks();
});

function showEditModal(bookmark)
{
   //Fill inputs, hide any errors, and show it
   $("#editbookmarkmodal #editbookmarktitle").val(bookmark.text());
   $("#editbookmarkmodal #editbookmarkurl").val(bookmark.attr("href"));
   $(".blankalert").hide();
   $("#editbookmarkmodal").modal();

   //Handle the save button
   $("#editbookmarksave").click(function() {
      //Did they leave anything blank?
      if($("#editbookmarkmodal #editbookmarktitle").val().trim().length == 0 || $("#editbookmarkmodal #editbookmarkurl").val().trim().length == 0)
      {
         //They've left a field blank
         $(".blankalert").show();
         return false;
      }

      bookmark.text($("#editbookmarkmodal #editbookmarktitle").val());
      bookmark.attr("href", $("#editbookmarkmodal #editbookmarkurl").val());

      //Now hide the modal up again
      $("#editbookmarkmodal").modal("hide");

      updateBookmarks();
   });

   //Handle the delete button
   $("#editbookmarkdelete").click(function() {
      //Remove us!
      bookmark.parent().remove();

      //Now hide the modal up again
      $("#editbookmarkmodal").modal("hide");

      updateBookmarks();
   });
}

//Detach the click handlers when the modal is hidden
$('#editbookmarkmodal').on('hidden.bs.modal', function (e) {
   $("#editbookmarksave").off("click");
   $("#editbookmarkdelete").off("click");
});

function updateBookmarks()
{
   //Here we take all the bookmarks, turn it into a javascript object, b64 encode it, and stuff it into data-encodedbookmarks
   var elements = $("#bookmarks .content .inner ul li a");
   var bookmarks = [];
   //Ignore the last one, it's a + button!
   for(var i = 0; i < elements.length - 1; i++)
   {
      var tempobj = {
         url: elements[i].href,
         title: elements[i].text
      };
      bookmarks.push(tempobj);
   }

   //JSON Stringify, encode, and stuff it into data with both data() and attr()
   var encbookmarks = Base64.encode(JSON.stringify({ "bookmarks": bookmarks }));
   $("#bookmarks").data("encodedbookmarks", encbookmarks);
   $("#bookmarks").attr("data-encodedbookmarks", encbookmarks);
}
