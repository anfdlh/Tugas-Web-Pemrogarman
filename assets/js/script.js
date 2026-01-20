function copyIP() {
    navigator.clipboard.writeText(
        "https://www.roblox.com/groups/campnomali"
    );
    const btn = document.querySelector('button[onclick="copyIP()"]');
    const originalHTML = btn.innerHTML;

    btn.innerHTML =
        '<i class="fa-solid fa-check me-2"></i> Berhasil Disalin!';
    btn.classList.remove("btn-toon-warning");
    btn.classList.add("bg-success", "text-white", "border-0");

    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove("bg-success", "text-white", "border-0");
        btn.classList.add("btn-toon-warning");
    }, 2000);
}

// Lightbox Functions
function openLightbox(imgSrc, caption) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    lightbox.classList.add('active');
    lightboxImg.src = imgSrc;
    lightboxCaption.textContent = caption;
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function () {
    const galleryCards = document.querySelectorAll('.gallery-card');
    galleryCards.forEach(card => {
        const randomRotation = (Math.random() * 6 - 3).toFixed(2);
        card.style.transform = `rotate(${randomRotation}deg)`;
    });

    const galleryImages = document.querySelectorAll('#gallery img');

    galleryImages.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function (e) {
            e.stopPropagation();
            const caption = this.alt || 'Gallery Image';
            openLightbox(this.src, caption);
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });

    if (document.getElementById('lightbox-img')) {
        document.getElementById('lightbox-img').addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    // --- FIREBASE CONFIGURATION ---
    const firebaseConfig = {
        apiKey: "AIzaSyBhsxo7KBwaNfPeCTm4Kq6oqAPDFH7UbH4",
        authDomain: "campnomali.firebaseapp.com",
        databaseURL: "https://campnomali-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "campnomali",
        storageBucket: "campnomali.firebasestorage.app",
        messagingSenderId: "320364029316",
        appId: "1:320364029316:web:514d6b6eb1f994308569d1",
        measurementId: "G-W19C9LSGJ2"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    // --- POSTING PAGE LOGIC ---
    const postForm = document.getElementById('postForm');
    const feedContainer = document.getElementById('feedContainer');
    const emptyState = document.getElementById('emptyState');

    if (postForm) {
        setupRealtimeListeners();

        const savedName = localStorage.getItem('campnomali_username');
        if (savedName) {
            document.getElementById('postName').value = savedName;
        }

        postForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const nameInput = document.getElementById('postName');
            const name = nameInput.value || 'Member Misterius';

            localStorage.setItem('campnomali_username', name);

            const text = document.getElementById('postText').value;
            const imageInput = document.getElementById('postImage');
            const file = imageInput.files[0];

            if (file) {
                const reader = new FileReader();
                reader.onloadend = function () {
                    const newPost = createPostObject(name, text, reader.result);
                    savePostToFirebase(newPost);
                };
                reader.readAsDataURL(file);
            } else {
                const newPost = createPostObject(name, text, null);
                savePostToFirebase(newPost);
            }
        });
    }

    function createPostObject(name, text, imageData) {
        return {
            author: name,
            text: text,
            image: imageData,
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            likes: 0,
            commentCount: 0,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
    }

    function savePostToFirebase(post) {
        const newPostRef = db.ref('posts').push();
        newPostRef.set(post, (error) => {
            if (error) {
                alert('Gagal memposting: ' + error.message);
            } else {
                document.getElementById('postForm').reset();
                togglePostForm();
            }
        });
    }

    // --- GRANULAR LISTENER (PRO VERSION) ---
    function setupRealtimeListeners() {
        if (!feedContainer) return;
        const postsRef = db.ref('posts').orderByChild('timestamp');

        postsRef.on('child_added', (snapshot) => {
            emptyState.style.display = 'none';
            const post = snapshot.val();
            const key = snapshot.key;
            renderPost(key, post, 'prepend');
        });

        postsRef.on('child_changed', (snapshot) => {
            const post = snapshot.val();
            const key = snapshot.key;
            updatePostUI(key, post);
        });

        postsRef.on('child_removed', (snapshot) => {
            const key = snapshot.key;
            const postEl = document.getElementById(`post-${key}`);
            if (postEl) {
                postEl.remove();
                if (feedContainer.children.length <= 1) {
                    emptyState.style.display = 'block';
                }
            }
        });
    }

    // Render HTML for a Post
    function renderPost(key, post, method = 'append') {
        // Check local likelihood
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts')) || [];
        const isLiked = likedPosts.includes(key);

        const likeIconClass = isLiked ? 'fa-solid' : 'fa-regular';
        const likeBtnColor = isLiked ? 'text-danger' : 'text-white';

        const commentCount = post.comments ? Object.keys(post.comments).length : 0;
        const savedName = localStorage.getItem('campnomali_username') || '';

        const postHTML = `
                <div class="post-card" id="post-${key}">
                    <div class="post-header">
                        <div class="d-flex align-items-center">
                            <div class="bg-toon-blue rounded-circle d-flex align-items-center justify-content-center text-white me-2 border border-2 border-dark" style="width: 40px; height: 40px; font-weight: bold;">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <div>
                                <h6 class="mb-0 fw-bold">${post.author}</h6>
                                <small class="text-muted" style="font-size: 0.8rem">${post.date}</small>
                            </div>
                        </div>
                        <button onclick="confirmDelete('${key}')" class="delete-btn" title="Hapus Postingan">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                    <div class="post-content">
                        <p class="mb-0 fs-5">${post.text}</p>
                        ${post.image ? `<div class="post-image-container"><img onclick="openLightbox(this.src, 'Post Image')" src="${post.image}" alt="Post Image"></div>` : ''}
                    </div>
                    <div class="post-footer">
                        <div onclick="toggleLikeFirebase('${key}')" id="like-btn-${key}" style="cursor: pointer; user-select: none;">
                            <i class="${likeIconClass} fa-heart me-2 ${likeBtnColor} fs-5"></i> 
                            <span class="fs-6 fw-bold dislike-count">${post.likes} Suka</span>
                        </div>
                        <div onclick="toggleComments('${key}')" style="cursor: pointer;">
                            <i class="fa-regular fa-comment me-2"></i> <span id="comment-count-${key}">${commentCount}</span> Komentar
                        </div>
                    </div>

                    <div id="comments-${key}" class="comment-section">
                         <div id="comment-list-${key}" class="comment-list">
                            <div class="text-center text-muted small py-2 loading-comments">Memuat komentar...</div>
                         </div>
                         <div id="name-edit-area-${key}" style="display: none;" class="mb-2 animation-slide-down">
                            <label class="small fw-bold text-muted ms-1">Posting sebagai:</label>
                            <input type="text" id="comment-author-${key}" value="${savedName}" class="form-control form-control-sm form-control-toon" placeholder="Nama Kamu">
                         </div>

                         <div class="comment-form">
                            <button onclick="toggleNameEdit('${key}')" class="btn btn-toon-dark rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 40px; height: 40px;" title="Ganti Nama">
                                <i class="fa-solid fa-user text-white"></i>
                            </button>

                            <input type="text" id="comment-text-${key}" class="form-control form-control-toon rounded-pill" placeholder="Tulis komentar...">
                            
                            <button onclick="sendComment('${key}')" class="btn btn-toon btn-toon-primary rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 40px; height: 40px;">
                                <i class="fa-solid fa-paper-plane"></i>
                            </button>
                         </div>
                    </div>
                </div>
            `;

        if (method === 'prepend') {
            feedContainer.insertAdjacentHTML('afterbegin', postHTML);
        } else {
            feedContainer.insertAdjacentHTML('beforeend', postHTML);
        }
    }
    function updatePostUI(key, post) {
        const postEl = document.getElementById(`post-${key}`);
        if (!postEl) return;

        const likeBtn = postEl.querySelector(`#like-btn-${key} span`);
        if (likeBtn) likeBtn.textContent = `${post.likes} Suka`;

        const commentCount = post.comments ? Object.keys(post.comments).length : 0;
        const commentCountSpan = document.getElementById(`comment-count-${key}`);
        if (commentCountSpan) commentCountSpan.textContent = commentCount;

        const commentList = document.getElementById(`comment-list-${key}`);
        if (commentList && commentList.closest('.comment-section').style.display === 'block') {
            loadCommentsForPost(key);
        }
    }

});

// --- GLOBAL FUNCTIONS ---

const firebaseConfigGlobal = {
    apiKey: "AIzaSyBhsxo7KBwaNfPeCTm4Kq6oqAPDFH7UbH4",
    authDomain: "campnomali.firebaseapp.com",
    databaseURL: "https://campnomali-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "campnomali",
    storageBucket: "campnomali.firebasestorage.app",
    messagingSenderId: "320364029316",
    appId: "1:320364029316:web:514d6b6eb1f994308569d1",
    measurementId: "G-W19C9LSGJ2"
};
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfigGlobal);
}

// --- LIKE SYSTEM ---
const processingLikes = {};

function toggleLikeFirebase(id) {
    if (processingLikes[id]) return;
    processingLikes[id] = true;

    const postRef = firebase.database().ref('posts/' + id);
    let likedPosts = JSON.parse(localStorage.getItem('liked_posts')) || [];
    const isLiked = likedPosts.includes(id);

    // Optimistic UI Update (Instant Feedback)
    const btn = document.getElementById(`like-btn-${id}`);
    const icon = btn.querySelector('i');
    const countSpan = btn.querySelector('span');
    let currentCount = parseInt(countSpan.textContent);

    if (isLiked) {
        icon.className = `fa-regular fa-heart me-2 text-white fs-5`;
        countSpan.textContent = `${currentCount - 1} Suka`;
    } else {
        icon.className = `fa-solid fa-heart me-2 text-danger fs-5`;
        countSpan.textContent = `${currentCount + 1} Suka`;
    }

    postRef.transaction((post) => {
        if (post) {
            if (post.likes === undefined) post.likes = 0;
            if (isLiked) post.likes--;
            else post.likes++;
        }
        return post;
    }, (error, committed, snapshot) => {
        processingLikes[id] = false;

        if (error) {
            console.log('Transaction failed!', error);
            return;
        }
        if (committed) {
            if (isLiked) {
                likedPosts = likedPosts.filter(pId => pId !== id);
            } else {
                likedPosts.push(id);
            }
            localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
        }
    });
}

// --- COMMENT SYSTEM ---
function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        loadCommentsForPost(postId);
    } else {
        section.style.display = 'none';
    }
}

function loadCommentsForPost(postId) {
    const list = document.getElementById(`comment-list-${postId}`);
    firebase.database().ref(`posts/${postId}/comments`).once('value', (snapshot) => {
        list.innerHTML = '';
        const comments = snapshot.val();
        if (comments) {
            Object.values(comments).forEach(comment => {
                const bubble = `
                        <div class="comment-bubble">
                            <div class="comment-author">${comment.author}</div>
                            <p class="comment-text">${comment.text}</p>
                        </div>
                       `;
                list.insertAdjacentHTML('beforeend', bubble);
            });
        } else {
            list.innerHTML = '<div class="text-center text-muted small py-2">Belum ada komentar.</div>';
        }
    });
}

function sendComment(postId) {
    const authorInput = document.getElementById(`comment-author-${postId}`);
    const textInput = document.getElementById(`comment-text-${postId}`);

    const author = authorInput.value || 'Netizen';

    localStorage.setItem('campnomali_username', author);

    const text = textInput.value;

    if (!text.trim()) return;

    const newComment = {
        author: author,
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    firebase.database().ref(`posts/${postId}/comments`).push(newComment).then(() => {
        textInput.value = '';
        loadCommentsForPost(postId);
    });
}

function toggleNameEdit(postId) {
    const area = document.getElementById(`name-edit-area-${postId}`);
    if (area) {
        if (area.style.display === 'none') {
            area.style.display = 'block';
            const input = document.getElementById(`comment-author-${postId}`);
            if (input) input.focus();
        } else {
            area.style.display = 'none';
        }
    }
}

function togglePostForm() {
    const formContainer = document.getElementById('postFormContainer');
    const toggleBtn = document.getElementById('togglePostInfos');

    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        toggleBtn.style.display = 'none';
    } else {
        formContainer.style.display = 'none';
        toggleBtn.style.display = 'block';
    }
}

// Delete Modal Logic
let postToDeleteId = null;

function confirmDelete(id) {
    postToDeleteId = id;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    postToDeleteId = null;
}

document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'confirmDeleteBtn') {
        if (postToDeleteId) {
            deletePostFirebase(postToDeleteId);
            closeDeleteModal();
        }
    }
    if (e.target && e.target.className.includes('delete-modal-overlay')) {
        closeDeleteModal();
    }
});

function deletePostFirebase(id) {
    firebase.database().ref('posts/' + id).remove()
        .then(() => console.log("Deleted"))
        .catch((error) => alert("Hapus gagal: " + error.message));
}

// --- DISCORD STATS INTEGRATION ---
function updateDiscordStats() {
    const inviteCode = 'hcxRcNvRvJ';
    const apiUrl = `https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.approximate_member_count) {
                const count = data.approximate_member_count;
                let formatted = count;

                if (count >= 1000) {
                    formatted = (count / 1000).toFixed(1) + 'K';
                }

                const counterEl = document.getElementById('discord-counter');
                if (counterEl) {
                    counterEl.innerText = `+${formatted}`;
                    counterEl.title = `${count} Total Members, ${data.approximate_presence_count} Online`;
                }

                const statsEl = document.getElementById('discord-stats-number');
                if (statsEl) {
                    statsEl.innerText = (count >= 1000) ? `${formatted}+` : count;
                }
            }
        })
        .catch(err => console.error('Discord API Error:', err));
}

// --- GALLERY PAGINATION (MOBILE ONLY) ---
function setupGalleryPagination() {
    const container = document.getElementById('gallery-container');
    const paginationContainer = document.getElementById('gallery-pagination');
    if (!container || !paginationContainer) return;

    const items = Array.from(container.children);
    const itemsPerPage = 3;
    let currentPage = 1;

    function renderPage(page) {
        const totalPages = Math.ceil(items.length / itemsPerPage);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;

        if (window.innerWidth < 768) {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;

            items.forEach((item, index) => {
                if (index >= start && index < end) {
                    item.style.display = 'block';
                    item.classList.add('animation-card');
                } else {
                    item.style.display = 'none';
                }
            });
            paginationContainer.classList.remove('d-none');
        } else {
            items.forEach(item => item.style.display = 'block');
            paginationContainer.classList.add('d-none');
            return;
        }

        let html = '';
        for (let i = 1; i <= totalPages; i++) {

            const activeClass = i === currentPage ? 'btn-toon-primary text-white' : 'btn-light text-toon-blue';
            html += `<button class="btn btn-sm ${activeClass} fw-bold border-0 shadow-sm" style="width:35px; height:35px; border-radius:50%;" onclick="changeGalleryPage(${i})">${i}</button>`;
        }

        // Next
        if (currentPage < totalPages) {
            html += `<button class="btn btn-sm btn-toon-light fw-bold ms-2" style="border-radius: 20px;" onclick="changeGalleryPage(${currentPage + 1})">Next</button>`;
        }

        paginationContainer.innerHTML = html;
    }

    window.changeGalleryPage = renderPage;

    renderPage(1);
    window.addEventListener('resize', () => renderPage(currentPage));
}

// Run on load
updateDiscordStats();
setupGalleryPagination();      