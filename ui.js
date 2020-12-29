$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLoggedInLinks = $("#logged-in-links")
  const $navLogOut = $("#nav-logout");
  const $submitNew = $("#submit-link")
  const $favoritesLink = $("#favorites-link")
  const $favoritedArticles = $("#favorited-articles")
  const $userProfile = $("#user-profile")
  const $userLink = $("#user-link")
  const $myStoriesLink = $("#my-stories-link");
  const $myArticles = $("#my-articles");
  const $deleteBtnDiv = $("#delete-btn-div");
  const $favoriteBtnDiv = $("#favorite-btn-div");
  const $unfavoriteBtnDiv = $("#unfavorite-btn-div")


  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();
    

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */
  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    clearButtons();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    clearButtons();
    await generateStories();
    $allStoriesList.show();
    if(currentUser){
    $favoriteBtnDiv.append("<button id='favorite-selected'>Favorite Selected</button>")
    }
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();
   
    //the button to save favorites will only display if a user is logged in
    if (currentUser) {
      showNavForLoggedInUser();
      $favoriteBtnDiv.append("<button id='favorite-selected'>Favorite Selected</button>")
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $favoriteBtnDiv.append("<button id='favorite-selected'>Favorite Selected</button>")
    $allStoriesList.show();
    $("li").prepend("<span><i class='far fa-thumbs-up'></span></i>")

    // update the navigation bar
    showNavForLoggedInUser();

  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const articleHTML = generateStoryHTML(story);
      if(currentUser){
        if(checkForFavorite(story, currentUser)){
        articleHTML.prepend("<span><i class='fas fa-thumbs-up'></i></span>")
      } else{
        articleHTML.prepend("<span><i class='far fa-thumbs-up'></i></span>")
      }
    }
     $allStoriesList.append(articleHTML);
  }
//cross references the story being populated against stories stored in favorites
function checkForFavorite(story, currentUser){
  for(let i = 0; i < currentUser.favorites.length; i++){
    if(currentUser.favorites[i].storyId == story.storyId){
      return true;
    }
  }
  return false;
  }

}
  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $favoritedArticles,
      $userProfile
    ];
    elementsArr.forEach($elem => $elem.hide());
  }
//Nav-bar will only display for logged in users
  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navLoggedInLinks.show();
    $userLink.text(`${localStorage.username}`)
    $userLink.show();
  }
//response for when Username link is clicked
  $userLink.click(function(){
    hideElements();
    clearButtons();
    generateProfile();
    $userProfile.show();
});

  //response for when "submit new story" link is clicked
  $submitNew.click(async function(){
    hideElements();
    clearButtons();
    $submitForm.show();
    await generateStories();
    $allStoriesList.show();
    $favoriteBtnDiv.append("<button id='favorite-selected'>Favorite Selected</button>")
  })
  //response for when "favorites" link is clicked
  $favoritesLink.click(function(){
    hideElements();
    clearButtons();
    generateFavoriteArticles();
    $favoritedArticles.show();
  })

  //response for when "my stories" linked is clicked
  $myStoriesLink.click(function(){
    hideElements();
    clearButtons();
    generateUserArticles();
    $myArticles.show();
  })

  /* simple function to pull the hostname from a URL */
  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  //retrieve data on newly submitted article from form 
  $submitForm.submit(async function(event){
    event.preventDefault();
    const url = ($("#url").val());
    const author = ($("#author").val());
    const title = ($("#title").val());
    const username = localStorage.username;
  //POST story to the API
    const newStoryObject = await storyList.addStory(currentUser, {
      title,
      author,
      url,
      username
    });
  //Add new story to the user interface and clear forms
    const newStoryMarkup = generateStoryHTML(newStoryObject);
    newStoryMarkup.prepend("<span><i class='far fa-thumbs-up'></i></span>")
    $allStoriesList.prepend(newStoryMarkup);
    $("#url").val("")
    $("#author").val("")
    $("#title").val("")
  })

  //function called to generate HTML for user profile
  function generateProfile() {
    $("#profile-name").text(`Name: ${currentUser.name}`);
    $("#profile-username").text(`Username: ${currentUser.username}`);
    $("#profile-account-date").text(`Account Created: ${currentUser.createdAt.slice(0, 10)}`);
    $("#profile-last-active").text(`Last Active: ${currentUser.updatedAt.slice(0, 10)}`)
    $("#profile-favorited-number").text(`Number of Favorited Articles: ${currentUser.favorites.length}`);
    $("#profile-submitted-number").text(`Number of Submitted Articles: ${currentUser.ownStories.length}`);
    $("navUserProfile").text(`${currentUser.username}`);
  }

  //function called to generate HTML for favorite articles
  async function generateFavoriteArticles(){
    $favoritedArticles.empty();
    for (let index in currentUser.favorites){
      let myFavorite = generateStoryHTML(currentUser.favorites[index]);
      myFavorite.prepend("<span><i class='far fa-thumbs-up thumb'></i></span>");
      $favoritedArticles.prepend(myFavorite);
    }

  //add the button to remove favorites, decide which text to display depending on whether or not articles have been faoverited
  $unfavoriteBtnDiv.append("<button id='unfavorite-selected'></button>");
  if(currentUser.favorites.length == 0){
    $("#unfavorite-selected").html("No Articles Favorited");
  } else{
    $("#unfavorite-selected").html("Unfavorite Selected");
  }
}


  //function called to generation HTML for user-submitted articles
  async function generateUserArticles(){
    $myArticles.empty();
    for(let index in currentUser.ownStories){
      let myArticle = generateStoryHTML(currentUser.ownStories[index]);
      myArticle.prepend("<span><i class='far fa-trash-alt'></i></span>");
      $myArticles.prepend(myArticle);
    }

  //logic for populating the text of the delete button based on whether or not there are articles to delete
  $deleteBtnDiv.append("<button id='delete-selected'></button>");
  if($myArticles.children().length == 0){
    $("#delete-selected").html("No Articles Submitted");
  }else{
    $("#delete-selected").html("Deleted Selected Articles");
  }
}

  //logic for deleting selected stories when the "delete" button is pushed
  $("body").on("click", "#delete-selected", function(){
    $("#my-articles").children().each(async function() {
      if ($(this).hasClass("to-be-deleted")){
        await storyList.removeStory(currentUser, $(this).attr("id"));
        $(this).remove();
      }
      //logic for populating the text of the delete button based on whether or not there are articles to delete
      if($myArticles.children().length == 0){
        $("#delete-selected").html("No Articles Submitted");
      }else{
        $("#delete-selected").html("Deleted Selected Articles");
      }
    })
  })

  //logic for favoriting selected stories when the "favorite" button is pushed
  $("body").on("click", "#favorite-selected", function(){
    $("#all-articles-list").children().each(async function(){
      if(($(this)).hasClass("to-be-favorited")){
        await currentUser.addFavorite($(this).attr("id"));
      }
    })
  })

  $("body").on("click", ("#unfavorite-selected"), function(){
    $favoritedArticles.children().each(async function(){
      if($(this).hasClass("to-be-unfavorited")){
        await currentUser.removeFavorite($(this).attr("id"));
        $(this).remove();
        if($favoritedArticles.children().length == 0){
          $("#unfavorite-selected").html("No Articles Favorited")
        } 
      }
    })
  })

  //function called to clear all buttons, used when user changes page
  function clearButtons(){
    $deleteBtnDiv.empty();
    $favoriteBtnDiv.empty();
    $unfavoriteBtnDiv.empty();
  }

  //logic for user toggling icons
  $("body").on("click", "i", function(){
    $(this).toggleClass("fas");
    $(this).toggleClass("far");
    if($(this).hasClass("thumb")){
      $(this).toggleClass("fa-thumbs-up");
      $(this).toggleClass("fa-thumbs-down");
    }

    let parentLi = $(this).parent().parent();
    let parentListElement = $(this).parent().parent().parent();
    let parentListElementId = parentListElement.attr("id");
    

    if(parentListElementId == "all-articles-list"){
      parentLi.toggleClass("to-be-favorited");
    }

    if(parentListElementId == "favorited-articles"){
      parentLi.toggleClass("to-be-unfavorited");
    }
    if(parentListElementId == "my-articles"){
      parentLi.toggleClass("to-be-deleted");
    }
  });


  /* sync current user information to localStorage */
  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
