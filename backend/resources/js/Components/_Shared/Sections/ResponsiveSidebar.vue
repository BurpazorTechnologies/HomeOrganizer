<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Link } from '@inertiajs/vue3';

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
    width: {
        type: String,
        default: '16rem'
    },
    posts: {
        type: Array,
        required: true
    },
    currentPath: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['update:isOpen', 'close']);

const sidebarRef = ref(null);
const hamburgerRef = ref(null);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const currentX = ref(0);
const currentY = ref(0);

const toggleSidebar = () => {
    emit('update:isOpen', !props.isOpen);
};

const closeSidebar = () => {
    emit('close');
};

// Draggable functionality for hamburger
const handleDragStart = (e) => {
    if (e.target === hamburgerRef.value || hamburgerRef.value.contains(e.target)) {
        isDragging.value = true;
        startX.value = e.clientX || (e.touches && e.touches[0].clientX);
        startY.value = e.clientY || (e.touches && e.touches[0].clientY);
        currentX.value = hamburgerRef.value.offsetLeft;
        currentY.value = hamburgerRef.value.offsetTop;

        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDrag);
        document.addEventListener('touchend', handleDragEnd);

        // Prevent default touch behavior
        e.preventDefault();
    }
};

const handleDrag = (e) => {
    if (!isDragging.value) return;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (!clientX || !clientY) return;

    const deltaX = clientX - startX.value;
    const deltaY = clientY - startY.value;

    // Calculate new position
    let newX = currentX.value + deltaX;
    let newY = currentY.value + deltaY;

    // Constrain to viewport bounds
    const maxX = window.innerWidth - hamburgerRef.value.offsetWidth;
    const maxY = window.innerHeight - hamburgerRef.value.offsetHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    // Apply new position
    hamburgerRef.value.style.left = `${newX}px`;
    hamburgerRef.value.style.top = `${newY}px`;
};

const handleDragEnd = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('touchend', handleDragEnd);
};

onMounted(() => {
    document.addEventListener('mousedown', handleDragStart);
    document.addEventListener('touchstart', handleDragStart);
});

onUnmounted(() => {
    document.removeEventListener('mousedown', handleDragStart);
    document.removeEventListener('touchstart', handleDragStart);
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('touchend', handleDragEnd);
});
</script>

<template>
    <div>
        <!-- Mobile Hamburger Button -->
        <button ref="hamburgerRef"
            class="md:hidden fixed top-4 right-4 z-50 p-3 rounded-full bg-surface text-primary-light hover:bg-surface-content/10 transition-colors shadow-lg cursor-move touch-none"
            @click="toggleSidebar" aria-label="Open sidebar">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>

        <!-- Sidebar -->
        <aside ref="sidebarRef" class="bg-surface fixed top-0 h-full z-40 transform transition-all duration-300 ease-in-out border-l
           md:border-l-0 md:border-r md:translate-x-0 overflow-y-auto" :class="[
            isOpen ? 'translate-x-0' : 'translate-x-full',
            'md:translate-x-0 md:block',
            'md:left-0 right-0 md:right-auto'
        ]" :style="{ width }" @click.self="closeSidebar">
            <div class="w-full py-4">
                <Link :href="route('blog.index')" class="block">
                    <span class="w-auto h-auto">
                        <img src="/assets/img/_shared/homeorganizer-tech-logo-white.svg" alt="HomeOrganizer logo"
                            class="w-[70px] h-auto object-contain mx-auto">
                    </span>
                </Link>
            </div>
            <!-- Sidebar content -->
            <div class="p-6 md:p-6 w-full text-surface-content">
                <nav class="space-y-2">
                    <Link v-for="post in posts" :key="post.slug" :href="`/blog/${post.slug}`"
                        class="block px-4 py-2 rounded-lg transition-colors text-lg" :class="[
                            currentPath === post.slug
                                ? 'bg-primary text-primary-content font-medium'
                                : 'text-surface-content hover:bg-surface-content/10'
                        ]">
                    {{ post.title }}
                    </Link>
                </nav>
            </div>
        </aside>

        <!-- Overlay for mobile when sidebar is open -->
        <div v-if="isOpen" class="fixed inset-0 bg-black/30 z-30 md:hidden" @click="closeSidebar"></div>
    </div>
</template>

<style scoped lang="scss">
.cursor-move {
    cursor: move;
    cursor: grab;
}

.cursor-move:active {
    cursor: grabbing;
}

/* Add smooth transition for width change */
aside {
    transition-property: transform, width;
}

/* Prevent button resizing */
button {
    resize: none;
    min-width: 3rem;
    min-height: 3rem;
    max-width: 3rem;
    max-height: 3rem;
    width: 3rem;
    height: 3rem;
}
</style>
