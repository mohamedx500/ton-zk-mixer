import React from 'react';

interface AssetIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
    size?: number;
}

interface SvgIconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    size?: number;
}

/**
 * Official TON Coin Icon - Sourced directly from ton-assets
 */
export function TonIcon({ className = 'w-5 h-5', size, ...props }: AssetIconProps) {
    return (
        <img
            src="/ton-assets/TON Logo/TON Coin.png"
            alt="TON"
            className={`object-contain inline-block shrink-0 ${className}`}
            width={size}
            height={size}
            draggable={false}
            {...props}
        />
    );
}

/**
 * Official TON Full Wordmark Logo - Sourced directly from ton-assets
 */
export function TonLogoFull({ className = 'h-7 w-auto', size, ...props }: AssetIconProps) {
    return (
        <img
            src="/ton-assets/TON White Logo/TON Logo White.svg"
            alt="TON"
            className={`object-contain inline-block shrink-0 ${className}`}
            width={size}
            height={size}
            draggable={false}
            {...props}
        />
    );
}

/**
 * Official TON Diamond Mark - Sourced directly from ton-assets
 */
export function TonDiamond({ className = 'w-5 h-5', size, ...props }: AssetIconProps) {
    return (
        <img
            src="/ton-assets/TON Logo/TON Coin.png"
            alt="TON"
            className={`object-contain inline-block shrink-0 ${className}`}
            width={size}
            height={size}
            draggable={false}
            {...props}
        />
    );
}

/**
 * Official Gram Diamond Mark - Sourced directly from ton-assets
 */
export function GramDiamondMark({ className = 'w-5 h-5', size, ...props }: AssetIconProps) {
    return (
        <img
            src="/ton-assets/Gram Diamond Mark/Gram Diamond Mark.png"
            alt="Gram"
            className={`object-contain inline-block shrink-0 ${className}`}
            width={size}
            height={size}
            draggable={false}
            {...props}
        />
    );
}

/**
 * Official Gram Circular Badge - Sourced directly from ton-assets
 */
export function GramCircularBadge({ className = 'w-5 h-5', size, ...props }: AssetIconProps) {
    return (
        <img
            src="/ton-assets/Gram Circular Badge/Gram Circular Badge.png"
            alt="Gram Badge"
            className={`object-contain inline-block shrink-0 ${className}`}
            width={size}
            height={size}
            draggable={false}
            {...props}
        />
    );
}

/**
 * Official Gram Full Logo - Sourced directly from ton-assets
 */
export function GramFullLogo({ className = 'h-7 w-auto', size, ...props }: AssetIconProps) {
    return (
        <img
            src="/ton-assets/Gram Full Logo/Gram Full Logo on Black.png"
            alt="Gram"
            className={`object-contain inline-block shrink-0 ${className}`}
            width={size}
            height={size}
            draggable={false}
            {...props}
        />
    );
}

// Alias for compatibility
export const GramIcon = GramDiamondMark;

/**
 * Merkle Tree Cryptographic Hash Tree Icon
 */
export function MerkleTreeIcon({ className = 'w-5 h-5', size, ...props }: SvgIconProps) {
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
            <circle cx="12" cy="4" r="2.5" fill="#30A1F5" />
            <path d="M12 6.5L7 11M12 6.5L17 11" stroke="#30A1F5" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="7" cy="12" r="2" fill="#0098EA" />
            <circle cx="17" cy="12" r="2" fill="#0098EA" />
            <path d="M7 14L4 18M7 14L10 18M17 14L14 18M17 14L20 18" stroke="#30A1F5" strokeWidth="1" strokeLinecap="round" />
            <circle cx="4" cy="19" r="1.5" fill="#38BDF8" />
            <circle cx="10" cy="19" r="1.5" fill="#38BDF8" />
            <circle cx="14" cy="19" r="1.5" fill="#38BDF8" />
            <circle cx="20" cy="19" r="1.5" fill="#38BDF8" />
        </svg>
    );
}

/**
 * Nullifier Hash / Cryptographic Key Lock Icon
 */
export function NullifierIcon({ className = 'w-5 h-5', size, ...props }: SvgIconProps) {
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
            <rect x="5" y="10" width="14" height="11" rx="2.5" stroke="#30A1F5" strokeWidth="1.5" fill="#0098EA" fillOpacity="0.2" />
            <path d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10" stroke="#30A1F5" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="15.5" r="1.5" fill="#FFFFFF" />
        </svg>
    );
}

/**
 * Relayer Gasless Lightning Fuel Icon
 */
export function RelayerFuelIcon({ className = 'w-5 h-5', size, ...props }: SvgIconProps) {
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
                fill="#30A1F5"
                fillOpacity="0.25"
                stroke="#30A1F5"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * ZK Privacy Shield Badge
 */
export function ZkShieldIcon({ className = 'w-5 h-5', size, ...props }: SvgIconProps) {
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
                stroke="#30A1F5"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="#0098EA"
                fillOpacity="0.15"
            />
            <path
                d="M9 12L11 14L15 10"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export const ZkCircuitIcon = ZkShieldIcon;
