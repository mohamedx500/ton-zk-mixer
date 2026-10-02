declare module 'snarkjs' {
    export const groth16: {
        fullProve(
            input: any,
            wasmFile: string | Uint8Array,
            zkeyFile: string | Uint8Array
        ): Promise<{ proof: any; publicSignals: string[] }>;
        verify(
            vKey: any,
            publicSignals: string[],
            proof: any
        ): Promise<boolean>;
    };
}

declare module 'ffjavascript' {
    export function buildBls12381(singleThread?: boolean): Promise<any>;
    export function buildBn128(singleThread?: boolean): Promise<any>;
    export const utils: {
        unstringifyBigInts(obj: any): any;
        stringifyBigInts(obj: any): any;
    };
    export const Scalar: any;
}
