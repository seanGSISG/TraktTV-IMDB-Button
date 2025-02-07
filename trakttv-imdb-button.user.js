// ==UserScript==
// @name         Trakt.tv Buttons for IMDb and Google Search (with !m and !t triggers)
// @namespace    http://your.namespace.here
// @version      1.5
// @description  On IMDb pages, adds buttons to open Trakt and add the title to your list. On Google search pages, if the query starts with "!m " (movies) or "!t " (TV shows), adds buttons for Trakt search and adding the top result.
// @match        https://www.imdb.com/title/tt*
// @match        https://www.google.com/search?q=*
// @grant        GM_xmlhttpRequest
// @connect      api.trakt.tv
// ==/UserScript==

(function() {
    'use strict';
  
    // === CONFIGURATION ===
    const TRAKT_CLIENT_ID = 'YOUR_CLIENT_ID';
    const TRAKT_API_VERSION = 2;
    const TRAKT_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN';
    const TRAKT_USERNAME = 'YOUR_USERNAME';
    // Hardcoded list slug for adding items.
    const DEFAULT_LIST_SLUG = 'watchlist';
  
    // === FUNCTIONS FOR TRAKT API CALLS ===
  
    // Function to add an item (movie or show) to the specified list based on type and its IMDb id.
    function addToTraktListForItem(type, imdbId) {
      if (!imdbId) {
        alert("IMDb ID not found.");
        return;
      }
      const payloadObj = {};
      if (type === 'movie') {
        payloadObj.movies = [{ ids: { imdb: imdbId } }];
      } else if (type === 'show') {
        payloadObj.shows = [{ ids: { imdb: imdbId } }];
      } else {
        alert("Unknown type: " + type);
        return;
      }
      const payload = JSON.stringify(payloadObj);
  
      const endpoint = `https://api.trakt.tv/users/${TRAKT_USERNAME}/lists/${DEFAULT_LIST_SLUG}/items`;
      GM_xmlhttpRequest({
        method: "POST",
        url: endpoint,
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": TRAKT_API_VERSION,
          "trakt-api-key": TRAKT_CLIENT_ID,
          "Authorization": `Bearer ${TRAKT_ACCESS_TOKEN}`
        },
        data: payload,
        onload: function(response) {
          console.log("Add to list response status:", response.status);
          console.log("Add to list response text:", response.responseText);
          if (response.status >= 200 && response.status < 300) {
            alert(`Successfully added ${type} (IMDb id ${imdbId}) to list: ${DEFAULT_LIST_SLUG}`);
          } else {
            alert(`Failed to add ${type} to list: ${DEFAULT_LIST_SLUG}`);
          }
        },
        onerror: function(err) {
          console.error("Network error in addToTraktListForItem:", err);
          alert("Network error: " + err.error);
        }
      });
    }
  
    // Function to search Trakt's endpoint for the query and add the top result to the list.
    function searchAndAddToList(query, type) {
      let endpoint;
      if (type === 'movie') {
        endpoint = `https://api.trakt.tv/search/movie?query=${encodeURIComponent(query)}`;
      } else if (type === 'show') {
        endpoint = `https://api.trakt.tv/search/show?query=${encodeURIComponent(query)}`;
      } else {
        alert("Unknown search type: " + type);
        return;
      }
  
      GM_xmlhttpRequest({
        method: "GET",
        url: endpoint,
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": TRAKT_API_VERSION,
          "trakt-api-key": TRAKT_CLIENT_ID
        },
        onload: function(response) {
          console.log("Search response status:", response.status);
          console.log("Search response text:", response.responseText);
          if (response.status >= 200 && response.status < 300) {
            let results;
            try {
              results = JSON.parse(response.responseText);
            } catch(e) {
              console.error("Error parsing search response:", e);
              alert("Failed to parse search results.");
              return;
            }
            console.log("Trakt search results:", results);
            if (results && results.length > 0) {
              // Use the first result.
              const topResult = results[0];
              let imdbId;
              if (type === 'movie' && topResult.movie && topResult.movie.ids && topResult.movie.ids.imdb) {
                imdbId = topResult.movie.ids.imdb;
              } else if (type === 'show' && topResult.show && topResult.show.ids && topResult.show.ids.imdb) {
                imdbId = topResult.show.ids.imdb;
              }
              if (imdbId) {
                addToTraktListForItem(type, imdbId);
                return;
              }
              alert("No IMDb id found in the top result.");
            } else {
              alert("No results found on Trakt for that query.");
            }
          } else {
            console.error("Search error:", response.responseText);
            alert("Error during Trakt search.");
          }
        },
        onerror: function(err) {
          console.error("Network error during search:", err);
          alert("Network error: " + err.error);
        }
      });
    }
  
    // === BUTTON CREATION FUNCTIONS ===
  
    // For IMDb title pages: create buttons using the IMDb id.
    function createIMDbButtons() {
      const parts = window.location.pathname.split('/');
      const imdbId = parts[2];
      if (!imdbId) return;
  
      let openButton = document.createElement('a');
      openButton.href = `https://trakt.tv/search/imdb/${imdbId}`;
      openButton.target = '_blank';
      openButton.textContent = 'Open Trakt';
      openButton.style.cssText = 'display:inline-block;margin-right:8px;padding:4px 8px;background:#E50914;color:#fff;border-radius:4px;font-size:14px;text-decoration:none;';
  
      let addButton = document.createElement('a');
      addButton.href = 'javascript:void(0)';
      addButton.textContent = 'Add to List';
      addButton.style.cssText = 'display:inline-block;margin-right:8px;padding:4px 8px;background:#1A73E8;color:#fff;border-radius:4px;font-size:14px;text-decoration:none;';
      addButton.addEventListener('click', function() {
        // On IMDb pages, assume the item is a movie.
        addToTraktListForItem('movie', imdbId);
      });
  
      let container = document.querySelector('.ipc-chip-list');
      if (container) {
        container.appendChild(openButton);
        container.appendChild(addButton);
      } else {
        console.error("Container '.ipc-chip-list' not found on IMDb page.");
      }
    }
  
    // For Google search pages: show buttons only if the query starts with a trigger.
    function createGoogleButtons() {
      const urlParams = new URLSearchParams(window.location.search);
      let query = urlParams.get('q');
      if (!query) return;
  
      let type;
      if (query.toLowerCase().startsWith('!m ')) {
        type = 'movie';
        query = query.substring(3).trim();
      } else if (query.toLowerCase().startsWith('!t ')) {
        type = 'show';
        query = query.substring(3).trim();
      } else {
        return; // Do not add buttons if no trigger is present.
      }
  
      // Create a container for the buttons.
      const btnContainer = document.createElement('div');
      btnContainer.style.cssText = 'margin:10px 0;padding:5px;background:#f1f1f1;border:1px solid #ccc;border-radius:4px;';
  
      let openButton = document.createElement('a');
      openButton.href = `https://trakt.tv/search?query=${encodeURIComponent(query)}&type=${type}`;
      openButton.target = '_blank';
      openButton.textContent = 'Open Trakt Search';
      openButton.style.cssText = 'display:inline-block;margin-right:8px;padding:4px 8px;background:#E50914;color:#fff;border-radius:4px;font-size:14px;text-decoration:none;';
  
      let addButton = document.createElement('a');
      addButton.href = 'javascript:void(0)';
      addButton.textContent = 'Add Top Result to List';
      addButton.style.cssText = 'display:inline-block;margin-right:8px;padding:4px 8px;background:#1A73E8;color:#fff;border-radius:4px;font-size:14px;text-decoration:none;';
      addButton.addEventListener('click', function() {
        searchAndAddToList(query, type);
      });
  
      btnContainer.appendChild(openButton);
      btnContainer.appendChild(addButton);
  
      // Insert the container at the top of the search results.
      let target = document.getElementById('topstuff') || document.body;
      target.insertBefore(btnContainer, target.firstChild);
    }
  
    // === POLLING FUNCTION FOR DYNAMIC CONTENT (IMDb) ===
    function waitForIMDbContainer() {
      let container = document.querySelector('.ipc-chip-list');
      if (container) {
        createIMDbButtons();
      } else {
        setTimeout(waitForIMDbContainer, 1000);
      }
    }
  
    // === DETERMINE WHICH PAGE WE'RE ON AND RUN APPROPRIATE CODE ===
    if (window.location.hostname.indexOf("imdb.com") !== -1) {
      window.addEventListener('load', waitForIMDbContainer);
    } else if (window.location.hostname.indexOf("google.com") !== -1 && window.location.pathname.startsWith("/search")) {
      window.addEventListener('load', createGoogleButtons);
    }
  })();
  