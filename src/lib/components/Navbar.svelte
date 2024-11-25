<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';  // Import base path
</script>

<nav class="bg-gray-800 p-4">
  <div class="container mx-auto">
    <div class="flex space-x-8">
      <a 
        href="{base}/" 
        class="text-gray-300 hover:text-white px-3 py-2 rounded-md {$page.url.pathname === '/' ? 'bg-gray-900 text-white' : ''}"
      >
        Home
      </a>
      <a 
        href="{base}/lol" 
        class="text-gray-300 hover:text-white px-3 py-2 rounded-md {$page.url.pathname === '/lol' ? 'bg-gray-900 text-white' : ''}"
      >
        LoL
      </a>
      <a 
        href="{base}/deadlock" 
        class="text-gray-300 hover:text-white px-3 py-2 rounded-md {$page.url.pathname === '/deadlock' ? 'bg-gray-900 text-white' : ''}"
      >
        Deadlock
      </a>
    </div>
  </div>
</nav>