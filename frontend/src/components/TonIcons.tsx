import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    size?: number;
}

/**
 * Official TON White Logo (Circle Diamond Mark + TON Wordmark)
 * Sourced directly from ton-assets
 */
export function TonLogoFull({ className = 'h-7 w-auto', ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 265 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            <g clipPath="url(#clip0_ton_full)">
                <path
                    d="M50.004 0c27.617 0 50.005 22.388 50.005 50.004 0 27.617-22.388 50.005-50.005 50.005C22.388 100.009 0 77.621 0 50.004 0 22.388 22.388 0 50.004 0zM31.347 26.311c-6.946 0-11.351 7.494-7.856 13.553L46.52 79.777c1.546 2.682 5.422 2.682 6.968 0l23.031-39.913c3.491-6.05-.913-13.553-7.855-13.553H31.347zm37.306 7.041c1.584 0 2.516 1.68 1.761 2.99L58.318 57.994l-.002.004-4.8 9.284v-33.93h15.137zm-22.173.005v33.915l-4.795-9.28-.002-.003-12.1-21.641-.035-.063c-.691-1.3.236-2.928 1.795-2.928H46.48zm84.553 43.467h10.831V39.052h14.975v-10.29h-40.782v10.29h14.976v37.772zm51.836.812c13.673 0 24.843-11.169 24.843-24.843 0-13.673-11.17-24.842-24.843-24.842-13.742 0-24.843 11.169-24.843 24.842 0 13.674 11.101 24.843 24.843 24.843zm0-10.424c-7.852 0-14.012-6.634-14.012-14.419 0-7.784 6.16-14.418 14.012-14.418 7.784 0 13.944 6.634 13.944 14.418 0 7.785-6.16 14.419-13.944 14.419zm74.268 9.612V28.763h-10.831v29.649l-23.353-29.65h-9.274v48.062h10.763V47.107l23.421 29.717h9.274z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath id="clip0_ton_full">
                    <path fill="#fff" d="M0 0H264.286V100H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * Official TON Foundation Circle Diamond Icon
 */
export function TonIcon({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <circle cx="28" cy="28" r="28" fill="#0098EA" />
            <path
                d="M19.18 18.5H36.82C38.6 18.5 39.69 20.48 38.74 21.96L28 38.75L17.26 21.96C16.31 20.48 17.4 18.5 19.18 18.5Z"
                fill="white"
            />
            <path
                d="M27.2 19.5L18.5 22.8C17.6 23.1 17.5 24.3 18.3 24.8L27.2 29.5V19.5Z"
                fill="#D4F0FC"
            />
            <path
                d="M28.8 19.5L37.5 22.8C38.4 23.1 38.5 24.3 37.7 24.8L28.8 29.5V19.5Z"
                fill="#EBF7FE"
            />
            <path
                d="M27.2 30.5L18.8 25.8C18 25.3 17.5 26.2 18 26.9L27.2 38.2V30.5Z"
                fill="#72CCF8"
            />
            <path
                d="M28.8 30.5L37.2 25.8C38 25.3 38.5 26.2 38 26.9L28.8 38.2V30.5Z"
                fill="#A2DDFB"
            />
        </svg>
    );
}

/**
 * Transparent TON Diamond mark
 */
export function TonDiamond({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <path
                d="M8.2 11.5H31.8C33.6 11.5 34.7 13.5 33.7 15L20 35L6.3 15C5.3 13.5 6.4 11.5 8.2 11.5Z"
                fill="#0098EA"
                fillOpacity="0.25"
            />
            <path
                d="M19.2 12.5L8.5 16.5C7.6 16.8 7.5 18 8.3 18.5L19.2 23.8V12.5Z"
                fill="#38BDF8"
            />
            <path
                d="M20.8 12.5L31.5 16.5C32.4 16.8 32.5 18 31.7 18.5L20.8 23.8V12.5Z"
                fill="#7DD3FC"
            />
            <path
                d="M19.2 25L8.8 19.8C8 19.3 7.5 20.2 8 20.9L19.2 34V25Z"
                fill="#0284C7"
            />
            <path
                d="M20.8 25L31.2 19.8C32 19.3 32.5 20.2 32 20.9L20.8 34V25Z"
                fill="#0EA5E9"
            />
        </svg>
    );
}

/**
 * Official Gram Diamond Mark
 * Sourced directly from ton-assets/Gram Diamond Mark
 */
export function GramDiamondMark({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <path
                d="M66.523 11.333H33.477c-4.401 0-6.601 0-8.592.616a13.792 13.792 0 0 0-4.808 2.625c-1.594 1.341-2.784 3.192-5.164 6.894L4.408 37.81c-1.572 2.446-2.358 3.67-2.572 4.956a6.322 6.322 0 0 0 .362 3.37c.482 1.212 1.51 2.24 3.567 4.296l39.033 39.034c1.821 1.82 2.731 2.731 3.781 3.072.924.3 1.918.3 2.842 0 1.05-.34 1.96-1.251 3.78-3.072l39.035-39.034c2.056-2.056 3.084-3.084 3.566-4.296a6.32 6.32 0 0 0 .362-3.37c-.214-1.287-1-2.51-2.572-4.956L85.087 21.47c-2.38-3.703-3.57-5.554-5.164-6.895a13.792 13.792 0 0 0-4.808-2.625c-1.99-.616-4.191-.616-8.592-.616z"
                fill="#30A1F5"
            />
            <path
                d="M60.268 24.224c.537-1.45 2.59-1.45 3.126 0l3.71 10.027a2.2 2.2 0 0 0 1.3 1.3l10.027 3.71c1.451.537 1.451 2.59 0 3.126l-10.027 3.71a2.2 2.2 0 0 0-1.3 1.3l-3.71 10.027c-.537 1.451-2.59 1.451-3.126 0l-3.71-10.027a2.2 2.2 0 0 0-1.3-1.3l-10.027-3.71c-1.451-.537-1.451-2.589 0-3.126l10.027-3.71a2.2 2.2 0 0 0 1.3-1.3l3.71-10.027z"
                fill="#fff"
            />
        </svg>
    );
}

/**
 * Official Gram Circular Badge
 * Sourced directly from ton-assets/Gram Circular Badge
 */
export function GramCircularBadge({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <rect width="100" height="100" rx="50" fill="#30A1F5" />
            <rect x=".5" y=".5" width="99" height="99" rx="49.5" stroke="#000" strokeOpacity=".06" />
            <path
                d="M60.41 26.75H39.59c-2.772 0-4.159 0-5.413.388a8.691 8.691 0 0 0-3.028 1.653c-1.005.846-1.754 2.012-3.254 4.344L21.277 43.43c-.99 1.54-1.486 2.311-1.62 3.122-.119.715-.04 1.45.228 2.123.304.764.951 1.411 2.247 2.707l24.59 24.59c1.148 1.148 1.721 1.722 2.383 1.936.582.19 1.208.19 1.79 0 .661-.214 1.235-.788 2.382-1.935l24.591-24.591c1.296-1.296 1.943-1.943 2.247-2.707a3.982 3.982 0 0 0 .228-2.123c-.134-.81-.63-1.581-1.62-3.122l-6.618-10.295c-1.5-2.332-2.25-3.498-3.254-4.344a8.692 8.692 0 0 0-3.028-1.653c-1.255-.388-2.64-.388-5.414-.388z"
                fill="#fff"
            />
            <path
                d="M56.469 34.871c.338-.914 1.631-.914 1.97 0l2.337 6.317c.14.38.44.679.819.82l6.317 2.337c.914.338.914 1.63 0 1.97l-6.317 2.337c-.38.14-.679.44-.82.818l-2.337 6.317c-.338.915-1.631.915-1.97 0l-2.337-6.317c-.14-.379-.44-.678-.819-.818l-6.316-2.338c-.915-.338-.915-1.631 0-1.97l6.316-2.337c.38-.14.679-.44.82-.819l2.337-6.317z"
                fill="#30A1F5"
            />
        </svg>
    );
}

/**
 * Official Gram Full Logo (Mark + Typography)
 * Sourced directly from ton-assets/Gram Full Logo
 */
export function GramFullLogo({ className = 'h-7 w-auto', ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 317 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            <path
                d="M61.267 19.262H36.753c-3.265 0-4.897 0-6.374.457a10.231 10.231 0 0 0-3.567 1.947c-1.182.995-2.065 2.368-3.83 5.114l-7.793 12.123c-1.167 1.814-1.75 2.721-1.908 3.676a4.69 4.69 0 0 0 .268 2.5c.358.9 1.12 1.662 2.646 3.187L45.15 77.223c1.351 1.35 2.026 2.026 2.805 2.279a3.41 3.41 0 0 0 2.108 0c.779-.253 1.454-.929 2.805-2.28l28.956-28.956c1.526-1.525 2.288-2.288 2.646-3.187a4.69 4.69 0 0 0 .268-2.5c-.158-.955-.741-1.862-1.908-3.676L75.04 26.78c-1.766-2.747-2.649-4.12-3.831-5.115a10.231 10.231 0 0 0-3.567-1.947c-1.476-.457-3.109-.457-6.374-.457z"
                fill="#30A1F5"
            />
            <path
                d="M56.628 28.825c.399-1.076 1.921-1.076 2.32 0l2.752 7.438c.165.447.517.8.964.965l7.438 2.752c1.077.398 1.077 1.92 0 2.319l-7.438 2.752a1.632 1.632 0 0 0-.964.965l-2.753 7.438c-.398 1.076-1.92 1.076-2.319 0l-2.752-7.438a1.632 1.632 0 0 0-.964-.965L45.473 42.3c-1.076-.398-1.076-1.92 0-2.32l7.439-2.752c.446-.165.799-.517.964-.964l2.752-7.438zM236.63 39.271h9.511v4.95h.619c1.186-1.908 2.809-3.403 4.872-4.486 2.062-1.134 4.33-1.701 6.805-1.701 2.784 0 5.181.644 7.191 1.933 2.063 1.289 3.532 2.964 4.408 5.026 1.289-2.062 3.042-3.737 5.259-5.026 2.217-1.289 4.794-1.933 7.733-1.933 4.485 0 7.862 1.392 10.13 4.176 2.32 2.732 3.48 6.418 3.48 11.058v24.359h-10.053V55.124c0-2.526-.567-4.434-1.701-5.723-1.083-1.34-2.655-2.01-4.717-2.01-2.63 0-4.692 1.057-6.187 3.17-1.495 2.114-2.242 4.846-2.242 8.197v18.869h-10.131V55.124c0-5.156-2.268-7.733-6.805-7.733-2.474 0-4.433 1.057-5.877 3.17-1.443 2.114-2.165 4.846-2.165 8.197v18.869h-10.13V39.27zM206.87 78.864c-2.63 0-5.027-.541-7.192-1.624-2.165-1.134-3.867-2.68-5.104-4.64-1.237-2.01-1.856-4.278-1.856-6.805 0-2.577.67-4.846 2.011-6.805 1.392-2.01 3.273-3.531 5.645-4.562 2.371-1.083 5.026-1.624 7.965-1.624 3.969 0 7.346.593 10.13 1.779v-1.315c0-2.062-.799-3.738-2.397-5.027-1.598-1.34-3.635-2.01-6.109-2.01-3.764 0-6.805 1.495-9.125 4.485l-7.115-5.104a18.544 18.544 0 0 1 7.115-5.645c2.835-1.289 5.954-1.933 9.357-1.933 5.928 0 10.439 1.392 13.533 4.176 3.144 2.783 4.717 6.856 4.717 12.218v23.199h-9.976v-4.021h-.619c-2.835 3.505-6.495 5.258-10.98 5.258zm2.319-7.888c1.805 0 3.403-.412 4.795-1.237 1.443-.876 2.552-1.985 3.325-3.325.773-1.392 1.16-2.861 1.16-4.408a18.524 18.524 0 0 0-7.965-1.778c-2.474 0-4.356.515-5.645 1.546-1.289 1.031-1.933 2.372-1.933 4.021 0 1.547.593 2.81 1.778 3.79 1.186.928 2.681 1.392 4.485 1.392zm-44.568-31.705h9.511v5.258h.619c.928-1.855 2.397-3.376 4.408-4.562 2.062-1.237 4.253-1.856 6.573-1.856 1.753 0 3.351.284 4.794.85v10.131c-2.216-.928-4.356-1.392-6.418-1.392-2.836 0-5.104 1.057-6.805 3.17-1.701 2.063-2.552 4.692-2.552 7.888v18.869h-10.13V39.27zm-33.464 39.593c-5.31 0-10.207-1.237-14.693-3.712-4.433-2.526-7.965-5.98-10.594-10.362-2.629-4.434-3.944-9.383-3.944-14.847 0-5.465 1.315-10.388 3.944-14.77 2.629-4.434 6.161-7.888 10.594-10.363 4.486-2.526 9.383-3.789 14.693-3.789 4.331 0 8.275.773 11.832 2.32 3.608 1.495 6.676 3.635 9.202 6.418l-7.192 7.038c-1.856-1.96-3.918-3.429-6.186-4.408-2.217-.98-4.82-1.47-7.81-1.47-3.351 0-6.47.8-9.357 2.398-2.836 1.598-5.104 3.84-6.806 6.727-1.649 2.887-2.474 6.187-2.474 9.899 0 3.712.851 7.01 2.552 9.898 1.701 2.887 3.969 5.13 6.805 6.728 2.887 1.598 6.032 2.397 9.434 2.397 5.104 0 9.357-1.52 12.76-4.563 1.031-.98 1.907-2.165 2.629-3.557a17.73 17.73 0 0 0 1.701-4.717h-17.322v-8.893h27.143c.361 1.444.541 3.068.541 4.872 0 3.66-.567 7.063-1.701 10.208a22.343 22.343 0 0 1-5.026 8.274c-2.526 2.68-5.542 4.743-9.048 6.186-3.454 1.392-7.346 2.088-11.677 2.088z"
                fill="currentColor"
            />
        </svg>
    );
}

// Aliases for compatibility
export const GramIcon = GramDiamondMark;

/**
 * ZK-SNARK Circuit Node Icon
 */
export function ZkCircuitIcon({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <path
                d="M12 2L19 6V18L12 22L5 18V6L12 2Z"
                stroke="#38BDF8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" fill="#0284C7" fillOpacity="0.6" stroke="#7DD3FC" strokeWidth="1.5" />
            <path d="M12 2V9M12 15V22M5 6L9.5 9.5M14.5 14.5L19 18M19 6L14.5 9.5M9.5 14.5L5 18" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    );
}

/**
 * Merkle Tree Cryptographic Hash Tree Icon
 */
export function MerkleTreeIcon({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <circle cx="12" cy="4" r="2.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            <path d="M12 6.5L7 11M12 6.5L17 11" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="7" cy="12" r="2" fill="#0284C7" stroke="#7DD3FC" strokeWidth="1" />
            <circle cx="17" cy="12" r="2" fill="#0284C7" stroke="#7DD3FC" strokeWidth="1" />
            <path d="M7 14L4 18M7 14L10 18M17 14L14 18M17 14L20 18" stroke="#0284C7" strokeWidth="1" strokeLinecap="round" />
            <circle cx="4" cy="19" r="1.5" fill="#7DD3FC" />
            <circle cx="10" cy="19" r="1.5" fill="#7DD3FC" />
            <circle cx="14" cy="19" r="1.5" fill="#7DD3FC" />
            <circle cx="20" cy="19" r="1.5" fill="#7DD3FC" />
        </svg>
    );
}

/**
 * Nullifier Hash / Cryptographic Key Lock Icon
 */
export function NullifierIcon({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <rect x="5" y="10" width="14" height="11" rx="2" stroke="#38BDF8" strokeWidth="1.5" fill="#0284C7" fillOpacity="0.2" />
            <path d="M8 10V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="15" r="1.5" fill="#FFFFFF" />
            <path d="M12 16.5V18.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    );
}

/**
 * Relayer Gasless Lightning Fuel Icon
 */
export function RelayerFuelIcon({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <path
                d="M13 2L4 14H11L10 22L20 10H13L13 2Z"
                fill="#38BDF8"
                fillOpacity="0.3"
                stroke="#38BDF8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12 6L7 13H11L10 18L16 11H12V6Z"
                fill="#E0F2FE"
            />
        </svg>
    );
}

/**
 * ZK Privacy Shield Badge
 */
export function ZkShieldIcon({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <path
                d="M12 2L4 5V11C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11V5L12 2Z"
                stroke="#38BDF8"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="#0098EA"
                fillOpacity="0.15"
            />
            <path
                d="M9 12L11 14L15 10"
                stroke="#7DD3FC"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
