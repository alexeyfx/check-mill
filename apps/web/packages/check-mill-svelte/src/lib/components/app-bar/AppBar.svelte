<script lang="ts">
	import { dialogStore } from "../dialogs";
	import { SettingsLazyDialog } from "../settings";

	const openSettingsDialogAction = () => dialogStore.open(SettingsLazyDialog);
</script>

<div class="app-bar">
	<div class="app-bar__top">
		<div class="app-logo">
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
					d="M22.0064 9.2627C22.7466 8.5225 23.9468 8.52245 24.687 9.2627L24.7559 9.33155C25.496 10.0718 25.496 11.272 24.7559 12.0122L14.6743 22.0932C14.5654 22.2022 14.4458 22.2942 14.3199 22.3711C14.2966 22.397 14.273 22.4228 14.2481 22.4477C13.5078 23.1879 12.3077 23.188 11.5674 22.4477L6.7832 17.6636C6.04295 16.9234 6.043 15.7232 6.7832 14.9829C7.52345 14.2427 8.7236 14.2427 9.46385 14.9829L12.8745 18.3936L22.0064 9.2627Z"
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
				<path
					d="M33.5 10.25C33.5 11.2165 32.7165 12 31.75 12C30.7835 12 30 11.2165 30 10.25C30 9.2835 30.7835 8.5 31.75 8.5C32.7165 8.5 33.5 9.2835 33.5 10.25Z"
					fill="#2B75FC"
				/>
				<path
					d="M11.5 31C11.5 31.8284 10.8285 32.5 10 32.5C9.17155 32.5 8.5 31.8284 8.5 31C8.5 30.1715 9.17155 29.5 10 29.5C10.8285 29.5 11.5 30.1715 11.5 31Z"
					fill="#3B73FD"
				/>
				<path
					d="M39 53C39 53.5525 38.5523 54 38 54C37.4477 54 37 53.5525 37 53C37 52.4475 37.4477 52 38 52C38.5523 52 39 52.4475 39 53Z"
					fill="#EA3A3D"
				/>
				<path
					d="M26.5 57.25C26.5 58.2165 25.7165 59 24.75 59C23.7835 59 23 58.2165 23 57.25C23 56.2835 23.7835 55.5 24.75 55.5C25.7165 55.5 26.5 56.2835 26.5 57.25Z"
					fill="#FAB95A"
				/>
				<path
					d="M5.4346 11.1496C5.64165 10.7908 6.10035 10.6679 6.4591 10.8749L13.1064 14.7115C13.4651 14.9185 13.5881 15.3772 13.3811 15.736L13.3186 15.8442C13.1115 16.203 12.6528 16.3259 12.2941 16.1189L5.6468 12.2823C5.28805 12.0753 5.16505 11.6166 5.37215 11.2578L5.4346 11.1496Z"
					fill="#FAB95A"
				/>
				<path
					d="M50.5735 49.0818C50.7805 48.723 51.2395 48.6001 51.598 48.8071L58.596 52.846C58.9545 53.053 59.0775 53.5115 58.8705 53.8705L58.808 53.9785C58.601 54.3375 58.1425 54.4605 57.7835 54.2535L50.786 50.2145C50.427 50.0075 50.304 49.5488 50.511 49.19L50.5735 49.0818Z"
					fill="#04215E"
				/>
				<path
					d="M10.8993 52.952C10.6064 52.659 10.6064 52.184 10.8993 51.891L15.142 47.6486C15.4349 47.3557 15.9097 47.3557 16.2026 47.6486L16.291 47.7369C16.5839 48.0298 16.5839 48.5047 16.291 48.7976L12.0484 53.0405C11.7555 53.333 11.2806 53.333 10.9877 53.0405L10.8993 52.952Z"
					fill="#1BD599"
				/>
				<path
					d="M46.1299 16.2288C45.837 15.9359 45.837 15.4611 46.1299 15.1682L52.7625 8.5357C53.0555 8.2428 53.53 8.2428 53.823 8.5357L53.9115 8.6241C54.2045 8.917 54.2045 9.39185 53.9115 9.68475L47.279 16.3172C46.9861 16.6101 46.5112 16.6101 46.2183 16.3172L46.1299 16.2288Z"
					fill="#04215E"
				/>
			</svg>
		</div>
		<div class="app-actions">
			<button
				type="button"
				class="app-action"
				on:click={openSettingsDialogAction}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
					/>
				</svg>
			</button>

			<button type="button" class="app-action">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="size-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
					/>
				</svg>
			</button>
		</div>
	</div>
	<div class="app-bar__bottom">
		<div class="handle"></div>
	</div>
</div>

<style lang="scss">
	.app-bar {
		position: absolute;
		left: 50%;
		bottom: 16px;
		transform: translateX(-50%);
		z-index: 1;

		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;

		border: 1px solid rgba(101, 190, 198, 0.832);
		border-radius: 16px;
		background-color: #ffffff;
		box-shadow: 0 0 0 2px rgba(205, 208, 212, 0.4);

		&__top,
		&__bottom {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12px;
		}
	}

	.handle {
		width: min(80%, 80px);
		height: 4px;

		border-radius: 2px;
		background-color: rgba(101, 190, 198, 0.832);
	}

	.app-logo {
		position: relative;

		width: 48px;
		height: 48px;

		border-radius: 8px;
		background-color: #eeeeee;
	}

	.checkbox-svg,
	.confetti-svg {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.app-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px;

		border-radius: 8px;
		background-color: rgba(238, 238, 238, 0.8);
	}

	.app-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		width: 40px;
		height: 40px;

		border: none;
		border-radius: 8px;
		background-color: transparent;
		color: #456882;
		outline: none;
		cursor: pointer;
		transition: background-color 0.2s ease;

		&:hover,
		&:focus {
			background-color: rgba(69, 104, 130, 0.1);
		}

		& svg {
			width: 24px;
			height: 24px;
		}
	}
</style>
