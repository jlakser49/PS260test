<template>
    <div :class="classes">
        <div v-if="loading" class="loading-text">Loading...</div>
        <div v-else class="items">
            <ul class="list">
                <template v-for="(item, i) in items" :key="item.title">
                    <li class="list-item">
                        <nuxt-link
                            class="link"
                            :to="item.to"
                            @mouseover="() => handleHover(i, true)"
                            @mouseout="() => handleHover(i, false)"
                        >
                            <div 
                                class="name-container"
                                :style="{ 
                                    viewTransitionName: `editor-${item.title.toLowerCase().replace(/\s+/g, '-')}` 
                                }"
                            >
                                <h2 class="name">{{ item.title }}</h2>
                                <span class="name-duplicate">{{ item.title }}</span>
                            </div>
                        </nuxt-link>
                        <video
                            v-if="item.media_file"
                            :ref="el => videoRefs[i] = el"
                            :src="item.media_file"
                            :poster="item.thumbnail"
                            class="image"
                            muted
                            playsinline
                            loop
                            preload="metadata"
                        ></video>
                    </li>
                    <br v-if="(i + 1) % 3 === 0">
                </template>
            </ul>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    items: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false
    },
});

const isHovered = ref(-1);
const videoRefs = ref({});
const videoTimeStamps = ref({}); // Store timestamps for each video

const classes = computed(() => {
    return [
        "gallery-list",
        { "is-hovered": isHovered.value >= 0 },
        { "is-loading": props.loading }
    ]
});

const handleHover = async (index, isEntering) => {
    isHovered.value = isEntering ? index : -1;
    
    const video = videoRefs.value[index];
    if (!video) return;

    try {
        if (isEntering) {
            // Resume from last position if it exists
            if (videoTimeStamps.value[index]) {
                video.currentTime = videoTimeStamps.value[index];
            }
            await video.play();
        } else {
            // Store current timestamp before pausing
            videoTimeStamps.value[index] = video.currentTime;
            video.pause();
        }
    } catch (error) {
        console.error('Video playback error:', error);
    }
};

// Handle video loop
const setupVideoListeners = (index) => {
    const video = videoRefs.value[index];
    if (!video) return;

    video.addEventListener('ended', () => {
        // Reset timestamp when video ends
        videoTimeStamps.value[index] = 0;
    });
};

const observeVideo = (index) => {
    const video = videoRefs.value[index];
    if (!video) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                video.load(); // Start loading the video
                observer.unobserve(video); // Stop observing once loading starts
            }
        });
    }, { rootMargin: '50px' });

    observer.observe(video);
};

// Watch for changes in videoRefs to set up listeners
watch(videoRefs, (newRefs) => {
    Object.keys(newRefs).forEach(index => {
        if (newRefs[index]) {
            setupVideoListeners(index);
            observeVideo(index);
        }
    });
});

// Clean up videos when component unmounts
onBeforeUnmount(() => {
    Object.values(videoRefs.value).forEach(video => {
        if (video) {
            video.pause();
            video.src = '';
            video.load();
        }
    });
});
</script>

<style lang="scss" scoped>
.gallery-list {
    display: flex;
    justify-content: center;
    align-items: center;

    .list {
        list-style: none;
        text-align: center;
        margin: 0;
        padding: 0;
    }

    .list-item {
        margin: 10px 20px;
        display: inline-block;
        padding: 0;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .link {
        position: relative;
        z-index: 20;
        cursor: pointer;
        display: inline-block;
        color: var(--color-yellow);
        text-decoration: none;
        font-size: 26px;
    }

    .name-container {
        position: relative;
        overflow: hidden;
        display: inline-block;
    }

    .name, 
    .name-duplicate {
        margin: 0;
        font-weight: 900;
        font-size: calc(1.5rem + ((1vw - 3.2px) * 0.3559));
        min-height: 0vw;
        width: 100%;
    }

    .name {
        position: relative;
        display: block;
        color: var(--color-yellow);
        transform: translateY(0);
        transition: transform 0.4s var(--easing-motion);
    }

    .name-duplicate {
        position: absolute;
        top: 100%;
        left: 0;
        color: var(--color-white);
        transform: translateY(0);
        transition: transform 0.4s var(--easing-motion);
    }

    .image {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        object-fit: cover;
        margin: auto;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.4s var(--easing-motion);
        pointer-events: none;
        width: 100vw;
        height: 100vh;
    }

    // Image Hover state
    @media (hover: hover) {
        .list-item:hover .image {
            opacity: 1;
        }
        
        .list-item:hover .name {
            transform: translateY(-100%); /* Move original text up and out */
        }
        
        .list-item:hover .name-duplicate {
            transform: translateY(-100%); /* Move duplicate up to replace original */
        }
    }

    @include lt-phone {
        .image {
            display: none;
        }
        .list {
            display: flex;
            flex-direction: column;
            gap: 5px;

            br {
                display: none;
            }
        }
    }

    // @include gt-cinema {
    //     .name {
    //         font-size: 67px;
    //     }
    // }
}
</style>