<script lang="ts"></script>

<div class="root">
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
