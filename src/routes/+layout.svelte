<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
  export const prerender = true;
  export const ssr = false;
</script>

<div class="min-h-screen bg-gray-900">
  <Navbar />
  <main class="container mx-auto p-4">
    <slot />
  </main>
</div>
