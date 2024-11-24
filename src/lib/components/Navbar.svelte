<!-- src/lib/components/Navbar.svelte -->
<script>
    import { page } from '$app/stores';
  </script>
  
  <nav class="bg-gray-800 p-4">
    <div class="container mx-auto">
      <div class="flex space-x-8">
        <a 
          href="/" 
          class="text-gray-300 hover:text-white px-3 py-2 rounded-md {$page.url.pathname === '/' ? 'bg-gray-900 text-white' : ''}"
        >
          Home
        </a>
        <a 
          href="/lol" 
          class="text-gray-300 hover:text-white px-3 py-2 rounded-md {$page.url.pathname === '/lol' ? 'bg-gray-900 text-white' : ''}"
        >
          LoL
        </a>
        <a 
          href="/deadlock" 
          class="text-gray-300 hover:text-white px-3 py-2 rounded-md {$page.url.pathname === '/deadlock' ? 'bg-gray-900 text-white' : ''}"
        >
          Deadlock
        </a>
      </div>
    </div>
  </nav>