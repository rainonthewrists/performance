import { texts } from './texts.js';


function getProjectKey() {
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(part => part && !part.endsWith('.html'));
  return parts[parts.length - 1] || '';
}


function initInfo(){
  const projectKey = getProjectKey();
  const artwork = texts.artworks[projectKey];

  if (!artwork) { console.warn(`No artwork data found for key: "${projectKey}"`); return; }

  const container = document.createElement('div');
  container.classList.add('project_info_container');
  if (document.body.classList.contains('archived')) {
    container.classList.add('open');
  }
  container.addEventListener('click', (e) => {
    container.classList.toggle('open');
    // Check if container is now open
    const isOpen = container.classList.contains('open');
    if (window.vimeoPlayer) {
      if (isOpen) window.vimeoPlayer.pause().catch(() => { /* ignore errors */ });
      else window.vimeoPlayer.play().catch(() => { /* ignore errors */ });
    }
  });
  

  const btn = document.createElement('button');
  btn.className = "arrow_btn";

  const back = document.createElement('div');
  back.className = "invisible";

  const title = document.createElement('p');
  const description = document.createElement('p');
  const author = document.createElement('p');
  const bio = document.createElement('p');
  
  title.className = 'black all_caps';
  author.className = 'black all_caps';
  description.className = 'grey';
  bio.className = 'grey';

  // Populate with artwork data
  title.innerHTML = artwork.title;
  author.innerHTML = artwork.author;
  description.innerHTML = artwork.description;
  bio.innerHTML = artwork.bio;

  container.appendChild(btn);
  container.appendChild(back);
  container.appendChild(title);
  container.appendChild(description);
  container.appendChild(author);
  container.appendChild(bio);

  document.body.appendChild(container);
}

window.onload = function() {
  initInfo();
};
