<script>
  import '../app.css';
  import Navbar from '$lib/components/Navbar.svelte';
</script>

<div class="min-h-screen bg-gray-900 text-white">
  <Navbar />
  <main class="container mx-auto p-4">
    <slot />
  </main>
</div>
