<script lang="ts"></script>

<div class="root">
    <div class="header">
        <div class="logo">
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="checkbox-svg"
            >
                <path
                    d="M0 8C0 3.5817 3.5817 0 8 0H24C28.4183 0 32 3.5817 32 8V24C32 28.4183 28.4183 32 24 32H8C3.5817 32 0 28.4183 0 24V8Z"
                    fill="#3B73FD"
                />
                <path
                    d="M22.0064 9.2627C22.7466 8.5225 23.9468 8.52245 24.687 9.2627L24.7559 9.33155C25.496 10.0718 25.496 11.272 24.7559 12.0122L14.6743 22.0932C13.934 22.8334 12.7338 22.8335 11.9936 22.0933L6.7832 16.883C6.04295 16.1427 6.043 14.9426 6.7832 14.2023C7.52345 13.4621 8.7236 13.4621 9.46385 14.2023L12.8745 17.6129L22.0064 9.2627Z"
                    fill="#FFFEFE"
                />
            </svg>
            <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="confetti-svg"
            >
                <!-- simplified confetti left unchanged -->
                <circle cx="32" cy="10" r="2" fill="#2B75FC" />
                <circle cx="10" cy="32" r="1.5" fill="#3B73FD" />
                <circle cx="38" cy="52" r="1" fill="#EA3A3D" />
                <circle cx="24" cy="57" r="2" fill="#FAB95A" />
            </svg>
        </div>
        <h2 class="title">Check me...</h2>
    </div>

    <div class="body">
        <section class="section flex flex-column gap-4">
            <div class="flex items-center justify-between gap-4">
                <h4 class="h4">Background pattern</h4>
            </div>

            <div class="scroller">
                {#each Array(4) as _, i}
                    <label class="radio-box">
                        <input
                            type="radio"
                            name="variant"
                            class="radio-box__input"
                        />
                        <div class="radio-box__media">
                            <div class="preview">#{i + 1}</div>
                        </div>
                    </label>
                {/each}
            </div>
        </section>

        <div class="divider"></div>

        <section class="section flex flex-column gap-4">
            <div class="flex items-center justify-between gap-4">
                <h4 class="h4">Checkbox pattern</h4>
            </div>

            <div class="scroller">
                {#each Array(4) as _, i}
                    <label class="radio-box">
                        <input
                            type="radio"
                            name="variant"
                            class="radio-box__input"
                        />
                        <div class="radio-box__media">
                            <div class="preview">#{i + 1}</div>
                        </div>
                    </label>
                {/each}
            </div>
        </section>
    </div>
</div>

<style lang="scss">
    .root {
        --padding-inline: calc(var(--spacing * 2));

        display: flex;
        flex-direction: column;
        gap: 32px;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .title {
        font-size: 20px;
        letter-spacing: 0.02em;
    }

    .logo {
        position: relative;
        width: 48px;
        height: 48px;
    }

    .checkbox-svg,
    .confetti-svg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .confetti-svg {
        opacity: 0.7;
        pointer-events: none;
    }

    .body {
        display: grid;
        border-radius: 24px;
        background: #fff;
    }

    .section {
        padding: var(--padding-inline);
    }

    .divider {
        display: block;
        width: 100%;
        height: 2px;
        background-color: #eff7f6;
    }

    .scroller {
        --scroller-mx: var(--padding-inline);
        --scroller-my: calc(var(--spacing) * 4);
        --scroller-columns: 3;
    }

    .radio-box {
        position: relative;
        width: 100%;
        flex: var(--scroller-child-flex, none);
        aspect-ratio: 1;
        border-radius: 12px;
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(220, 220, 220, 0.7);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition: all 0.2s ease;

        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
        }

        &:has(input:checked) {
            border-color: #1a73e8;
            box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.3);
        }

        &__input {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        &__media {
            width: 100%;
            height: 100%;
            border-radius: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9fafb;
            transition: background 0.2s ease;

            .preview {
                font-weight: 500;
                color: #555;
            }
        }
    }
</style>
