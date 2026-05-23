<template>
    <figure :class="mediaClasses">
        <!-- Loading State -->
        <div v-if="!hasLoaded && showLoader" class="media-loader">
            <slot name="loader">
                <div class="default-loader"></div>
            </slot>
        </div>

        <div class="media-sizer" :style="sizerStyles">
            <!-- Image Component -->
            <img
                v-if="mediaType === 'image'"
                ref="imageRef"
                class="media-content image"
                :src="mediaSource"
                :srcset="mediaSrcSet"
                :sizes="mediaSizes"
                :alt="mediaAlt"
                :style="mediaPositionStyles"
                :loading="lazyLoad ? 'lazy' : 'eager'"
                @load="handleMediaLoaded('image')"
                @error="handleMediaError('image')"
            >

            <!-- Video Component -->
            <video
                v-else-if="mediaType === 'video'"
                ref="videoRef"
                class="media-content video"
                :src="mediaSource"
                :poster="thumbnailUrl"
                :style="mediaPositionStyles"
                :autoplay="autoplay"
                :loop="loop"
                :muted="muted"
                :controls="showControls"
                :playsinline="playsinline"
                :preload="preload"
                @loadeddata="handleMediaLoaded('video')"
                @error="handleMediaError('video')"
                @timeupdate="handleTimeUpdate"
                @play="handlePlay"
                @pause="handlePause"
                @ended="handleEnded"
            >
                <source
                    v-for="source in videoSources"
                    :key="source.url"
                    :src="source.url"
                    :type="source.type"
                >
            </video>

            <!-- Error State -->
            <div v-if="hasError" class="media-error">
                <slot name="error">
                    <span>{{ errorMessage }}</span>
                </slot>
            </div>
        </div>

        <!-- Caption -->
        <figcaption
            v-if="caption"
            class="media-caption"
            :class="{ 'is-visible': showCaption }"
        >
            {{ caption }}
        </figcaption>

        <slot />
    </figure>
</template>

<script>
export default {
    name: 'StoryblokMedia',

    props: {
        // Core Media Props
        source: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            default: 'image',
            validator: value => ['image', 'video'].includes(value)
        },
        alt: {
            type: String,
            default: ''
        },
        caption: {
            type: String,
            default: ''
        },

        // Dimension Props
        width: {
            type: Number,
            default: 0
        },
        height: {
            type: Number,
            default: 0
        },
        aspectRatio: {
            type: Number,
            default: 0
        },

        // Image Specific Props
        srcset: {
            type: String,
            default: ''
        },
        sizes: {
            type: String,
            default: ''
        },

        // Video Specific Props
        videoSources: {
            type: Array,
            default: () => []
        },
        thumbnailUrl: {
            type: String,
            default: ''
        },
        autoplay: {
            type: Boolean,
            default: false
        },
        loop: {
            type: Boolean,
            default: false
        },
        muted: {
            type: Boolean,
            default: true
        },
        playsinline: {
            type: Boolean,
            default: true
        },
        showControls: {
            type: Boolean,
            default: false
        },

        // Layout Props
        fit: {
            type: String,
            default: 'cover',
            validator: value => ['cover', 'contain', 'fill'].includes(value)
        },
        position: {
            type: Object,
            default: () => ({ x: 50, y: 50 })
        },
        backgroundColor: {
            type: String,
            default: ''
        },

        // Feature Flags
        lazyLoad: {
            type: Boolean,
            default: true
        },
        showLoader: {
            type: Boolean,
            default: true
        },
        showCaption: {
            type: Boolean,
            default: true
        },
        preload: {
            type: String,
            default: 'metadata'
        }
    },

    data() {
        return {
            isLoaded: false,
            hasError: false,
            errorMessage: '',
            isPlaying: false,
            progress: 0,
            duration: 0
        }
    },

    computed: {
        mediaType() {
            return this.type
        },

        mediaSource() {
            return this.source
        },

        mediaSrcSet() {
            return this.srcset
        },

        mediaSizes() {
            return this.sizes
        },

        mediaAlt() {
            return this.alt
        },

        mediaClasses() {
            return [
                'storyblok-media',
                `media-type-${this.mediaType}`,
                `fit-${this.fit}`,
                {
                    'is-loaded': this.isLoaded,
                    'has-error': this.hasError,
                    'is-playing': this.isPlaying
                }
            ]
        },

        sizerStyles() {
            const styles = {}

            if (this.aspectRatio) {
                styles.paddingBottom = `${(1 / this.aspectRatio) * 100}%`
            } else if (this.width && this.height) {
                styles.paddingBottom = `${(this.height / this.width) * 100}%`
            }

            if (this.backgroundColor) {
                styles.backgroundColor = this.backgroundColor
            }

            return styles
        },

        mediaPositionStyles() {
            return {
                objectFit: this.fit,
                objectPosition: `${this.position.x}% ${this.position.y}%`
            }
        }
    },

    methods: {
        handleMediaLoaded(type) {
            this.isLoaded = true
            this.hasError = false
            this.$emit('loaded', { type })
        },

        handleMediaError(type) {
            this.hasError = true
            this.errorMessage = `Failed to load ${type}`
            this.$emit('error', { type, message: this.errorMessage })
        },

        handleTimeUpdate(event) {
            if (this.$refs.videoRef) {
                const video = this.$refs.videoRef
                this.progress = (video.currentTime / video.duration) * 100
                this.$emit('timeupdate', {
                    currentTime: video.currentTime,
                    duration: video.duration,
                    progress: this.progress
                })
            }
        },

        handlePlay() {
            this.isPlaying = true
            this.$emit('play')
        },

        handlePause() {
            this.isPlaying = false
            this.$emit('pause')
        },

        handleEnded() {
            this.isPlaying = false
            this.$emit('ended')
        },

        // Video Control Methods
        play() {
            if (this.$refs.videoRef) {
                return this.$refs.videoRef.play()
            }
        },

        pause() {
            if (this.$refs.videoRef) {
                this.$refs.videoRef.pause()
            }
        },

        seek(time) {
            if (this.$refs.videoRef) {
                this.$refs.videoRef.currentTime = time
            }
        },

        setVolume(level) {
            if (this.$refs.videoRef) {
                this.$refs.videoRef.volume = Math.max(0, Math.min(1, level))
            }
        },

        toggleMute() {
            if (this.$refs.videoRef) {
                this.$refs.videoRef.muted = !this.$refs.videoRef.muted
            }
        }
    },

    beforeDestroy() {
        if (this.$refs.videoRef) {
            this.$refs.videoRef.pause()
            this.$refs.videoRef.src = ''
            this.$refs.videoRef.load()
        }
    }
}
</script>

<style lang="scss">
.storyblok-media {
    position: relative;
    margin: 0;
    width: 100%;

    // Loader
    .media-loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 5;
    }

    .default-loader {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-top-color: var(--color-black);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    // Media Container
    .media-sizer {
        position: relative;
        width: 100%;
        height: 0;
        overflow: hidden;
    }

    // Media Content
    .media-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    // Error State
    .media-error {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.05);
        color: #666;
    }

    // Caption
    .media-caption {
        margin-top: 8px;
        font-size: 14px;
        line-height: 1.4;
        color: #666;
        
        &:not(.is-visible) {
            display: none;
        }
    }

    // States
    &.is-loaded {
        .media-content {
            opacity: 1;
        }
    }

    // Object Fit Modes
    &.fit-cover .media-content {
        object-fit: cover;
    }

    &.fit-contain .media-content {
        object-fit: contain;
    }

    &.fit-fill .media-content {
        object-fit: fill;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    // Responsive
    @media (max-width: 768px) {
        .media-caption {
            font-size: 12px;
        }
    }
}
</style>