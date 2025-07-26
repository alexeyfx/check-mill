<script lang="ts">
  import { Dialogs } from "./lib/components/dialogs";
  import { AppBar } from "./lib/components/app-bar";
  import { CheckMillRenderer } from "./lib/components/check-mill-renderer";
</script>

<div class="content">
  <CheckMillRenderer />
  <AppBar />
</div>
<Dialogs />

<style lang="scss">
  .content {
    position: relative;
    isolation: isolate;
    height: 100vh;
  }
</style>
