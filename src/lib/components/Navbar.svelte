<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';

  // Helper function to check if path matches
  $: isCurrentPath = (path) => {
    const currentPath = $page.url.pathname;
    const basePath = base || '';
    return currentPath === `${basePath}${path}`;
  }
</script>

<nav class="bg-gray-800 p-4">
  <div class="container mx-auto">
    <div class="flex space-x-8">
      <a 
        href="{base}/" 
        class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-lg font-extrabold {isCurrentPath('/') ? 'bg-gray-900 text-white' : ''}"
      >
        Home
      </a>
      <a 
        href="{base}/lol" 
        class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-lg font-extrabold {isCurrentPath('/lol') ? 'bg-gray-900 text-white' : ''}"
      >
        LoL
      </a>
      <a 
        href="{base}/deadlock" 
        class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-lg font-extrabold {isCurrentPath('/deadlock') ? 'bg-gray-900 text-white' : ''}"
      >
        Deadlock
      </a>
    </div>
  </div>
</nav>