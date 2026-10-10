import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    size?: number;
}

/**
 * Official TON Foundation Diamond Logo
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
 * Transparent TON Diamond mark (no background circle)
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
 * Gram / Jetton Token SVG
 */
export function GramIcon({ className = 'w-5 h-5', size, ...props }: IconProps) {
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
            <circle cx="12" cy="12" r="10" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="1.5" />
            <path
                d="M12 5L17 10.5L12 19L7 10.5L12 5Z"
                fill="#10B981"
                fillOpacity="0.8"
            />
            <path
                d="M12 5V19M7 10.5H17"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
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
                stroke="#06B6D4"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" fill="#06B6D4" fillOpacity="0.6" stroke="#22D3EE" strokeWidth="1.5" />
            <path d="M12 2V9M12 15V22M5 6L9.5 9.5M14.5 14.5L19 18M19 6L14.5 9.5M9.5 14.5L5 18" stroke="#0891B2" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    );
}
