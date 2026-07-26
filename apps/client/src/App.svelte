<script lang="ts">
    import { CheckMillRenderer } from "@check-mill/svelte";
</script>

<div class="root">
    <CheckMillRenderer endpointUrl="http://localhost:4000/view" />
</div>

<style lang="scss">
    .root {
        position: absolute;
        inset: 0;
        overflow: hidden;
    }
</style>
