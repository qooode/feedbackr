import PocketBase from 'pocketbase';

const pb = new PocketBase(
  import.meta.env.VITE_PB_URL || window.location.origin
);

// Auto-cancel duplicate requests
pb.autoCancellation(false);

export default pb;
