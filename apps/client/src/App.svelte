<script lang="ts">
    import { CheckMillRenderer } from "@check-mill/svelte";
    import { Settings } from "./lib/components/settings";
</script>

<div class="content">
    <div class="frame">
        <CheckMillRenderer endpointUrl="http://localhost:4000/view" />
    </div>
    <div class="settings-panel">
        <Settings />
    </div>
</div>

<style lang="scss">
    .content {
        display: grid;
        grid-template-columns: 1fr minmax(280px, 25%);
        gap: 24px;
        position: relative;
        isolation: isolate;
        width: 100%;
        height: 100%;
        padding: 24px;
    }

    .frame {
        background-color: #e5e5f7;
        background:
            radial-gradient(
                circle,
                transparent 20%,
                #e5e5f7 20%,
                #e5e5f7 80%,
                transparent 80%,
                transparent
            ),
            radial-gradient(
                    circle,
                    transparent 20%,
                    #e5e5f7 20%,
                    #e5e5f7 80%,
                    transparent 80%,
                    transparent
                )
                25px 25px,
            linear-gradient(#444cf7 2px, transparent 2px) 0 -1px,
            linear-gradient(90deg, #444cf7 2px, #e5e5f7 2px) -1px 0;
        background-size:
            50px 50px,
            50px 50px,
            25px 25px,
            25px 25px;
        border-radius: 24px;
        box-shadow: inset rgba(149, 157, 165, 0.4) 0px 8px 24px;
        overflow: hidden;
    }

    .settings-panel {
        overflow: hidden auto;
    }
</style>
