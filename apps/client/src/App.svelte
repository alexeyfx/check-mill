<script lang="ts">
    import { CheckMillRenderer } from "@check-mill/svelte";
    import { Settings } from "./lib/components/settings";

    let isOpen = $state(true);

    function toggleSettings() {
        isOpen = !isOpen;
    }
</script>

<div class="wrapper" class:settings-closed={!isOpen}>
    <div class="frame">
        <CheckMillRenderer endpointUrl="http://localhost:4000/view" />
    </div>

    <div class="settings-panel">
        <Settings />
    </div>

    <button
        type="button"
        class="burger"
        aria-label={isOpen ? "Close settings" : "Open settings"}
        aria-expanded={isOpen}
        onclick={toggleSettings}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="burger-icon"
            class:rotated={isOpen}
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
        </svg>
    </button>
</div>

<style lang="scss">
    :root {
        --cm-radius-l: 32px;
        --cm-radius-m: 16px;
        --cm-radius-s: 12px;

        --cm-spacing-s: 8px;
        --cm-spacing-m: 28px;

        --cm-gap: var(--cm-spacing-s);
        --cm-panel-width: max(280px, 25%);

        --cm-corner-offset: calc(
            (var(--cm-spacing-m) + var(--cm-radius-l)) / 2
        );

        --cm-color-accent: #444cf7;
        --cm-color-surface: #e5e5f7;
        --cm-color-surface-overlay: rgba(255, 255, 255, 0.85);
        --cm-color-surface-overlay-hover: #ffffff;
        --cm-color-surface-overlay-active: #f0f1ff;
        --cm-color-border: rgba(68, 76, 247, 0.15);
        --cm-color-border-hover: rgba(68, 76, 247, 0.3);

        --cm-elevation-inset: inset rgba(149, 157, 165, 0.4) 0px 8px 24px;
        --cm-elevation-raised:
            0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        --cm-elevation-raised-hover: 0 6px 16px rgba(68, 76, 247, 0.12);

        --cm-easing: cubic-bezier(0.4, 0, 0.2, 1);
    }

    .wrapper {
        position: relative;
        isolation: isolate;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .frame {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: calc(var(--cm-gap) + var(--cm-panel-width));
        z-index: 1;

        box-sizing: border-box;
        overflow: hidden;
        box-shadow: var(--cm-elevation-inset);

        background-color: var(--cm-color-surface);
        background:
            radial-gradient(
                circle,
                transparent 20%,
                var(--cm-color-surface) 20%,
                var(--cm-color-surface) 80%,
                transparent 80%,
                transparent
            ),
            radial-gradient(
                    circle,
                    transparent 20%,
                    var(--cm-color-surface) 20%,
                    var(--cm-color-surface) 80%,
                    transparent 80%,
                    transparent
                )
                25px 25px,
            linear-gradient(var(--cm-color-accent) 2px, transparent 2px) 0 -1px,
            linear-gradient(
                    90deg,
                    var(--cm-color-accent) 2px,
                    var(--cm-color-surface) 2px
                ) -1px
                0;
        background-size:
            50px 50px,
            50px 50px,
            25px 25px,
            25px 25px;

        transition: right 0.4s var(--cm-easing);
    }

    .wrapper.settings-closed .frame {
        right: 0;
    }

    .settings-panel {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: var(--cm-panel-width);
        padding: var(--cm-gap);
        z-index: 1;

        box-sizing: border-box;
        overflow: hidden;

        opacity: 1;
        visibility: visible;
        transform: translateX(0);
        transition:
            transform 0.4s var(--cm-easing),
            opacity 0.3s ease,
            visibility 0s linear 0s;
    }

    .wrapper.settings-closed .settings-panel {
        transform: translateX(calc(100% + var(--cm-gap)));
        opacity: 0;
        visibility: hidden;
        transition:
            transform 0.4s var(--cm-easing),
            opacity 0.3s ease,
            visibility 0s linear 0.4s;
    }

    .burger {
        position: absolute;
        top: calc(20px + 2 * var(--cm-gap));
        right: calc(20px + 2 * var(--cm-gap));
        transform: translate(50%, -50%);
        pointer-events: auto;

        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        padding: 0;

        cursor: pointer;
        border: 1px solid var(--cm-color-border);
        border-radius: var(--cm-radius-m);
        background-color: var(--cm-color-surface-overlay);
        backdrop-filter: blur(8px);
        box-shadow: var(--cm-elevation-raised);
        color: var(--cm-color-accent);
        z-index: 1;

        transition:
            background-color 0.2s var(--cm-easing),
            transform 0.1s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;

        &:hover {
            background-color: var(--cm-color-surface-overlay-hover);
            border-color: var(--cm-color-border-hover);
            color: #2b33db;
            box-shadow: var(--cm-elevation-raised-hover);
        }

        &:active {
            transform: translate(50%, -50%) scale(0.95);
            background-color: var(--cm-color-surface-overlay-active);
        }

        &:focus-visible {
            outline: 2px solid var(--cm-color-accent);
            outline-offset: 2px;
        }

        .burger-icon {
            width: 22px;
            height: 22px;
            transition: transform 0.3s var(--cm-easing);

            &.rotated {
                transform: rotate(90deg);
            }
        }
    }

    @media (max-width: 768px) {
        .frame {
            top: 0;
            left: 0;
            right: auto;
            bottom: 0;
            width: 100%;
            height: 100%;
        }

        .frame {
            transition: transform 0.4s var(--cm-easing);
            transform: translateX(0);
        }

        .wrapper.settings-closed .frame {
            right: auto;
            transform: translateX(-100%);
        }

        .settings-panel {
            top: 0;
            left: 100%;
            right: auto;
            bottom: 0;
            width: 100%;
            height: 100%;
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
            transition: transform 0.4s var(--cm-easing);
        }

        .wrapper.settings-closed .settings-panel {
            opacity: 1;
            visibility: visible;
            transform: translateX(-100%);
        }
    }
</style>
