import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    size?: number;
}

/**
 * Official TON Foundation Diamond Logo (Vibrant Web3 Blue)
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
                d="M37.56 16.5H18.44C15.63 16.5 13.9 19.64 15.42 21.99L26.54 39.19C27.24 40.27 28.76 40.27 29.46 39.19L40.58 21.99C42.1 19.64 40.37 16.5 37.56 16.5Z"
                fill="none"
            />
            {/* Top base */}
            <path
                d="M19.18 18.5H36.82C38.6 18.5 39.69 20.48 38.74 21.96L28 38.75L17.26 21.96C16.31 20.48 17.4 18.5 19.18 18.5Z"
                fill="white"
            />
            {/* Left facet */}
            <path
                d="M27.2 19.5L18.5 22.8C17.6 23.1 17.5 24.3 18.3 24.8L27.2 29.5V19.5Z"
                fill="#D4F0FC"
            />
            {/* Right facet */}
            <path
                d="M28.8 19.5L37.5 22.8C38.4 23.1 38.5 24.3 37.7 24.8L28.8 29.5V19.5Z"
                fill="#EBF7FE"
            />
            {/* Bottom spine */}
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
 * Transparent TON Diamond mark (Faceted Crystal without circular badge)
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
                fillOpacity="0.2"
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
 * Telegram Open Network - Classic Gram (GRAM) Crystal Token Icon
 * The iconic multifaceted triangular Gram crystal emblem of the TON ecosystem.
 */
export function GramIcon({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            {/* Background ambient glow circle */}
            <circle cx="24" cy="24" r="22" fill="#0098EA" fillOpacity="0.12" stroke="#0098EA" strokeWidth="1.2" strokeOpacity="0.3" />
            
            {/* Gram Crystal Geometry: Outer Triangular Silhouette */}
            <path
                d="M24 7L39 18.5L24 41L9 18.5L24 7Z"
                fill="#0088CC"
                fillOpacity="0.35"
                stroke="#38BDF8"
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            {/* Top Upper Pyramid */}
            <path
                d="M24 7L39 18.5H9L24 7Z"
                fill="#38BDF8"
                fillOpacity="0.75"
            />
            {/* Central Spine facet */}
            <path
                d="M24 7L24 41L9 18.5L24 7Z"
                fill="#0284C7"
                fillOpacity="0.85"
            />
            <path
                d="M24 7L39 18.5L24 41V7Z"
                fill="#0EA5E9"
                fillOpacity="0.9"
            />
            {/* Highlighted crystal cuts */}
            <path
                d="M24 18.5L9 18.5L24 41L39 18.5H24Z"
                stroke="#E0F2FE"
                strokeWidth="0.8"
                strokeOpacity="0.7"
            />
            <path
                d="M24 7V41"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeOpacity="0.9"
            />
        </svg>
    );
}

/**
 * Telegram Gram Coin Badge (Token Circle)
 */
export function GramCoin({ className = 'w-5 h-5', size, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width={size}
            height={size}
            {...props}
        >
            <circle cx="16" cy="16" r="15" fill="#0098EA" />
            <path
                d="M16 6L24.5 13.5L16 26L7.5 13.5L16 6Z"
                fill="#FFFFFF"
            />
            <path
                d="M16 6L7.5 13.5L16 26V6Z"
                fill="#D4F0FC"
            />
            <path
                d="M16 13.5L7.5 13.5L16 26L24.5 13.5H16Z"
                fill="#72CCF8"
                fillOpacity="0.5"
            />
            <path
                d="M16 6V26"
                stroke="#0077B6"
                strokeWidth="0.8"
            />
        </svg>
    );
}

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
            {/* Root node */}
            <circle cx="12" cy="4" r="2.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            {/* Level 1 branches */}
            <path d="M12 6.5L7 11M12 6.5L17 11" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="7" cy="12" r="2" fill="#0284C7" stroke="#7DD3FC" strokeWidth="1" />
            <circle cx="17" cy="12" r="2" fill="#0284C7" stroke="#7DD3FC" strokeWidth="1" />
            {/* Level 2 leaves */}
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
 * ZK Privacy Shield Badge with cryptographic lines
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
