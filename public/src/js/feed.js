var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var snackbar = document.querySelector('#confirmation-toast');

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(card) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp centered';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url("${card.image}")`;
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.backgroundPosition = 'center';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = card.title;
  cardTitleTextElement.style.color = '#FFF';
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = card.location;
  cardSupportingText.style.textAlign = 'center';
  // var btn = document.createElement('button');
  // btn.textContent = 'save';
  // btn.className = 'mdl-button mdl-js-button mdl-button--raised';
  // btn.addEventListener('click', onBtnClicked);
  // cardSupportingText.appendChild(btn);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  data.forEach(createCard);
}

function onBtnClicked(event) {
  if ('caches' in window) {
    caches.open('demand')
      .then(cache => cache.addAll(['https://httpbin.org/get', '/src/images/sf-boat.jpg']))
  }
}

var url = 'https://my-first-pwa-ebf14.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    var rows = [];
    for (let row of Object.values(data)) {
      rows.push(row);
    }
    updateUI(rows);
  });

if ('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      if (!networkDataReceived) {
        updateUI(data);
      }
    });
} 

form.addEventListener('submit', function(e) {
  e.preventDefault();
  
  var titleInput = document.querySelector('#title');
  var locationInput = document.querySelector('#location');

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('qqqqq');
    return false;
  }

  closeCreatePostModal();

  var post = {
    title: titleInput.value,
    location: locationInput.value,
    id: new Date().toISOString(),
    image: `http://placehold.it/500x320?text=${titleInput.value}`
  };

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function(sw) {
        writeData('sync-posts', post)
          .then(function() {
            return sw.sync.register('sync-new-posts');
          })
          .then(function() {
            var data = { message: 'Your post was saved for syncing' };
            snackbar.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function(err) {
            console.log('err', err);
          });

      });
  } else {
    sendData(post);
  }
});

function sendData(data) {
  return fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data)
  })
    .then(function(res) {
      var data = { message: 'Post sent!' };
      snackbar.MaterialSnackbar.showSnackbar(data);
      updateUI();
    });
}

// if ('caches' in window) {
//   caches.match(url)
//     .then(function(response) {
//       if (response) {
//         return response.json();
//       }
//     })
//     .then(function(data) {
//       if (!networkDataReceived && data) {
//         updateUI(data);
//       }
//     })
// }

