import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type Verify = {
    $$type: 'Verify';
    piA: Cell;
    piB: Cell;
    piC: Cell;
    pubInputs: Dictionary<number, bigint>;
}

export function storeVerify(src: Verify) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(993839639, 32);
        b_0.storeRef(src.piA);
        b_0.storeRef(src.piB);
        const b_1 = new Builder();
        b_1.storeRef(src.piC);
        b_1.storeDict(src.pubInputs, Dictionary.Keys.Uint(32), Dictionary.Values.BigInt(257));
        b_0.storeRef(b_1.endCell());
    };
}

export function loadVerify(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 993839639) { throw Error('Invalid prefix'); }
    const _piA = sc_0.loadRef();
    const _piB = sc_0.loadRef();
    const sc_1 = sc_0.loadRef().beginParse();
    const _piC = sc_1.loadRef();
    const _pubInputs = Dictionary.load(Dictionary.Keys.Uint(32), Dictionary.Values.BigInt(257), sc_1);
    return { $$type: 'Verify' as const, piA: _piA, piB: _piB, piC: _piC, pubInputs: _pubInputs };
}

export function loadTupleVerify(source: TupleReader) {
    const _piA = source.readCell();
    const _piB = source.readCell();
    const _piC = source.readCell();
    const _pubInputs = Dictionary.loadDirect(Dictionary.Keys.Uint(32), Dictionary.Values.BigInt(257), source.readCellOpt());
    return { $$type: 'Verify' as const, piA: _piA, piB: _piB, piC: _piC, pubInputs: _pubInputs };
}

export function loadGetterTupleVerify(source: TupleReader) {
    const _piA = source.readCell();
    const _piB = source.readCell();
    const _piC = source.readCell();
    const _pubInputs = Dictionary.loadDirect(Dictionary.Keys.Uint(32), Dictionary.Values.BigInt(257), source.readCellOpt());
    return { $$type: 'Verify' as const, piA: _piA, piB: _piB, piC: _piC, pubInputs: _pubInputs };
}

export function storeTupleVerify(source: Verify) {
    const builder = new TupleBuilder();
    builder.writeCell(source.piA);
    builder.writeCell(source.piB);
    builder.writeCell(source.piC);
    builder.writeCell(source.pubInputs.size > 0 ? beginCell().storeDictDirect(source.pubInputs, Dictionary.Keys.Uint(32), Dictionary.Values.BigInt(257)).endCell() : null);
    return builder.build();
}

export function dictValueParserVerify(): DictionaryValue<Verify> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVerify(src)).endCell());
        },
        parse: (src) => {
            return loadVerify(src.loadRef().beginParse());
        }
    }
}

export type Verifier$Data = {
    $$type: 'Verifier$Data';
}

export function storeVerifier$Data(src: Verifier$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
    };
}

export function loadVerifier$Data(slice: Slice) {
    const sc_0 = slice;
    return { $$type: 'Verifier$Data' as const };
}

export function loadTupleVerifier$Data(source: TupleReader) {
    return { $$type: 'Verifier$Data' as const };
}

export function loadGetterTupleVerifier$Data(source: TupleReader) {
    return { $$type: 'Verifier$Data' as const };
}

export function storeTupleVerifier$Data(source: Verifier$Data) {
    const builder = new TupleBuilder();
    return builder.build();
}

export function dictValueParserVerifier$Data(): DictionaryValue<Verifier$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVerifier$Data(src)).endCell());
        },
        parse: (src) => {
            return loadVerifier$Data(src.loadRef().beginParse());
        }
    }
}

 type Verifier_init_args = {
    $$type: 'Verifier_init_args';
}

function initVerifier_init_args(src: Verifier_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
    };
}

async function Verifier_init() {
    const __code = Cell.fromHex('b5ee9c724102140100049a000114ff00f4a413f4bcf2c80b01020162020701aad001d072d721d200d200fa4021103450666f04f86102f862ed44d0d20030916d916de202915be07021d74920c21f953101d31f02de2182103b3cca17bae30232c00001c121b09930c87f01ca00c9ed54e030f2c08203044a5bd4d4d430d0d4f40430f8416f24135f03820afaf080bef2e10503db3c02db3c01db3c550205040506004220d7393001d73931c0009720d749810300ba9170e29520d74ac0009170e2f2e106004220d7393001d73931c0009720d749810180ba9170e29520d74ac0009170e2f2e106011cdb3cf2e10430c87f01ca00c9ed54090125a02c47da89a1a4006122db22dbc4aa61b67863080104db3c0904e8547321db3c20db3c8d0c2daedb47ac7a5e0319703cad2bdeff2dc73b9abcefdf238b37eb39b81abf4e83236bfe05b9b0bfd94e02c7290b0e85bda02170db3c8d0c2cbf8b2cc66fdcd858d7658f4bce2ad9a1e0a8eae8bc234924c24693d6b1f5461f934a6da473f2234bb04ecc05428dc06023710a0b0d0c00ea22d749810180ba9522d74ac0009170e29721d749810300ba9170e29521d74ac0009170e29720d749810180ba9170e29520d74ac0009170e2f2e10622f93017c3009621f93027c3009170e29620f93017c3009170e2f2e10602f93018c00095f93028c000923070e295f93018c000923070e2f2e106008a20802081010159f4866fa520965023d7003058966c216d326d01e231908e2420c104f2e102802022028101014133f47c6fa520965023d7003058966c216d326d01e231e85b04fcdb3c8d0c282a0bc2140b872408053a41cd25c33436530da3ff25b78b1e916ea21bda88809b319412e02f335c31588fe52ed2684ce02572db3c8d0c2a1f12655ddd1fe31955a3bdb0846d16e8fbde972df4a6a8d719ca94091dda5a5b9ff24199229178bde00e228e8b7775e00773db3c1067105610451034413074f930140d0d0d0e00588020018101014133f40e6fa19401d70030925b6de2206e93f2c101de20c2ff96f930315210b99170e2f2e10304da89f9301003f930128d1824f80ad8149c67d81f6b34e82209d3d9565af43426482d86ad76986ef71fd4124cd33c4484e51755f96b1f4157410adf8092a8acbc23c2a449820149cb71441471b91eb53e900ec0ad1442d91eb8f45dc2eb00c9aa016efbf52015b230486f6e2089890f10111200608ea2b792fe594ae95794a3a9f999390db5589011d721e78e5fe660d206dea642d1701417a76fb04e38b0f6f5816e4b1d00c087e3f16ce1380378128d6f5bae70bb65eb28dfd5bc38a8e4225fd52c40d64be21c7fe5e1705601d484dfe3114bf0ebe60a1d166e81cde814ec3b3c870a4f33a88478e09a0799d648a5d205522b74eb5c77ad6857a2c5ac42ae643901c02b31790060937dfd26fa61d2e961cc0019adc901f0ecb6f409f1cd3b2afc720afbaca42f13671c0c44fd6f8d27c1af886151cd56480116895e23103474f93030c3001300c080b61272470f2c76aaf8fee9838e01d367807d80037af69c196c450498336824ecc4ba6073bfd2e2a015816826f7f3de1300f0483130e69764278d6185eb448436fa4d325bfa83ac2ca3d4f7d5690fcee8853f689c7c97706feb4680038e7339acb6d51d');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initVerifier_init_args({ $$type: 'Verifier_init_args' })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const Verifier_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
} as const

export const Verifier_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
} as const

const Verifier_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"Verify","header":993839639,"fields":[{"name":"piA","type":{"kind":"simple","type":"cell","optional":false}},{"name":"piB","type":{"kind":"simple","type":"cell","optional":false}},{"name":"piC","type":{"kind":"simple","type":"cell","optional":false}},{"name":"pubInputs","type":{"kind":"dict","key":"uint","keyFormat":32,"value":"int"}}]},
    {"name":"Verifier$Data","header":null,"fields":[]},
]

const Verifier_opcodes = {
    "Verify": 993839639,
}

const Verifier_getters: ABIGetter[] = [
    {"name":"verify","methodId":71203,"arguments":[{"name":"piA","type":{"kind":"simple","type":"slice","optional":false}},{"name":"piB","type":{"kind":"simple","type":"slice","optional":false}},{"name":"piC","type":{"kind":"simple","type":"slice","optional":false}},{"name":"pubInputs","type":{"kind":"dict","key":"uint","keyFormat":32,"value":"int"}}],"returnType":{"kind":"simple","type":"bool","optional":false}},
]

export const Verifier_getterMapping: { [key: string]: string } = {
    'verify': 'getVerify',
}

const Verifier_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"Verify"}},
    {"receiver":"internal","message":{"kind":"empty"}},
]

export const vk_gamma_2 = Cell.fromHex("b5ee9c724101010100620000c093e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8c946a7f4").beginParse();
export const vk_delta_2 = Cell.fromHex("b5ee9c724101010100620000c087e3f16ce1380378128d6f5bae70bb65eb28dfd5bc38a8e4225fd52c40d64be21c7fe5e1705601d484dfe3114bf0ebe60a1d166e81cde814ec3b3c870a4f33a88478e09a0799d648a5d205522b74eb5c77ad6857a2c5ac42ae643901c02b31790bb11d31").beginParse();
export const vk_alpha_1 = Cell.fromHex("b5ee9c72410101010032000060937dfd26fa61d2e961cc0019adc901f0ecb6f409f1cd3b2afc720afbaca42f13671c0c44fd6f8d27c1af886151cd5648a24c02d7").beginParse();
export const vk_beta_2 = Cell.fromHex("b5ee9c724101010100620000c080b61272470f2c76aaf8fee9838e01d367807d80037af69c196c450498336824ecc4ba6073bfd2e2a015816826f7f3de1300f0483130e69764278d6185eb448436fa4d325bfa83ac2ca3d4f7d5690fcee8853f689c7c97706feb4680038e7339b1de561f").beginParse();
export const IC0 = Cell.fromHex("b5ee9c724101010100320000608ea2b792fe594ae95794a3a9f999390db5589011d721e78e5fe660d206dea642d1701417a76fb04e38b0f6f5816e4b1d00b19b43").beginParse();
export const IC1 = Cell.fromHex("b5ee9c72410101010032000060b6bb6d1eb1e9780c65c0f2b4af7bfcb71cee6af3bf7c8e2cdface6e06afd3a0c8daff816e6c2ff65380b1ca42c3a16f6ae6a7e66").beginParse();
export const IC2 = Cell.fromHex("b5ee9c72410101010032000060b2fe2cb319bf7361635d963d2f38ab668782a3aba2f08d2493091a4f5ac7d5187e4d29b691cfc88d2ec13b30150a3701e26c4968").beginParse();
export const IC3 = Cell.fromHex("b5ee9c72410101010032000060a0a82f08502e1c902014e90734970cd0d94c368ffc96de2c7a45ba886f6a22026cc6504b80bccd70c5623f94bb49a1331ef1b1bd").beginParse();
export const IC4 = Cell.fromHex("b5ee9c72410101010032000060a87c499577747f8c65568ef6c211b45ba3ef7a5cb7d29aa35c672a50247769696e7fc906648a45e2f780388a3a2dddd7f1256a70").beginParse();
export const ERR_PUBLIC_NOT_PRESENT = 257n;
export const ERR_TOO_MANY_PUBLICS = 258n;
export const ERR_SCALAR_NOT_IN_FIELD = 259n;
export const ERR_WRONG_PROOF = 260n;
export const ERR_NOT_ENOUGH_VALUE = 261n;
export const ERR_INVALID_INPUTS = 262n;
export const MIN_VERIFY_VALUE = 50000000n;

export class Verifier implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = Verifier_errors_backward;
    public static readonly opcodes = Verifier_opcodes;
    
    static async init() {
        return await Verifier_init();
    }
    
    static async fromInit() {
        const __gen_init = await Verifier_init();
        const address = contractAddress(0, __gen_init);
        return new Verifier(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new Verifier(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  Verifier_types,
        getters: Verifier_getters,
        receivers: Verifier_receivers,
        errors: Verifier_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: Verify | null) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Verify') {
            body = beginCell().store(storeVerify(message)).endCell();
        }
        if (message === null) {
            body = new Cell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getVerify(provider: ContractProvider, piA: Slice, piB: Slice, piC: Slice, pubInputs: Dictionary<number, bigint>) {
        const builder = new TupleBuilder();
        builder.writeSlice(piA.asCell());
        builder.writeSlice(piB.asCell());
        builder.writeSlice(piC.asCell());
        builder.writeCell(pubInputs.size > 0 ? beginCell().storeDictDirect(pubInputs, Dictionary.Keys.Uint(32), Dictionary.Values.BigInt(257)).endCell() : null);
        const source = (await provider.get('verify', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
}