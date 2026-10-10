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

export type DepositTon = {
    $$type: 'DepositTon';
    commitment: bigint;
}

export function storeDepositTon(src: DepositTon) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4097, 32);
        b_0.storeUint(src.commitment, 256);
    };
}

export function loadDepositTon(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4097) { throw Error('Invalid prefix'); }
    const _commitment = sc_0.loadUintBig(256);
    return { $$type: 'DepositTon' as const, commitment: _commitment };
}

export function loadTupleDepositTon(source: TupleReader) {
    const _commitment = source.readBigNumber();
    return { $$type: 'DepositTon' as const, commitment: _commitment };
}

export function loadGetterTupleDepositTon(source: TupleReader) {
    const _commitment = source.readBigNumber();
    return { $$type: 'DepositTon' as const, commitment: _commitment };
}

export function storeTupleDepositTon(source: DepositTon) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.commitment);
    return builder.build();
}

export function dictValueParserDepositTon(): DictionaryValue<DepositTon> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDepositTon(src)).endCell());
        },
        parse: (src) => {
            return loadDepositTon(src.loadRef().beginParse());
        }
    }
}

export type Withdraw = {
    $$type: 'Withdraw';
    piA: Cell;
    piB: Cell;
    piC: Cell;
    root: bigint;
    nullifierHash: bigint;
    recipient: Address;
    assetId: bigint;
}

export function storeWithdraw(src: Withdraw) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4098, 32);
        b_0.storeRef(src.piA);
        b_0.storeRef(src.piB);
        const b_1 = new Builder();
        b_1.storeRef(src.piC);
        b_1.storeUint(src.root, 256);
        b_1.storeUint(src.nullifierHash, 256);
        b_1.storeAddress(src.recipient);
        const b_2 = new Builder();
        b_2.storeUint(src.assetId, 256);
        b_1.storeRef(b_2.endCell());
        b_0.storeRef(b_1.endCell());
    };
}

export function loadWithdraw(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4098) { throw Error('Invalid prefix'); }
    const _piA = sc_0.loadRef();
    const _piB = sc_0.loadRef();
    const sc_1 = sc_0.loadRef().beginParse();
    const _piC = sc_1.loadRef();
    const _root = sc_1.loadUintBig(256);
    const _nullifierHash = sc_1.loadUintBig(256);
    const _recipient = sc_1.loadAddress();
    const sc_2 = sc_1.loadRef().beginParse();
    const _assetId = sc_2.loadUintBig(256);
    return { $$type: 'Withdraw' as const, piA: _piA, piB: _piB, piC: _piC, root: _root, nullifierHash: _nullifierHash, recipient: _recipient, assetId: _assetId };
}

export function loadTupleWithdraw(source: TupleReader) {
    const _piA = source.readCell();
    const _piB = source.readCell();
    const _piC = source.readCell();
    const _root = source.readBigNumber();
    const _nullifierHash = source.readBigNumber();
    const _recipient = source.readAddress();
    const _assetId = source.readBigNumber();
    return { $$type: 'Withdraw' as const, piA: _piA, piB: _piB, piC: _piC, root: _root, nullifierHash: _nullifierHash, recipient: _recipient, assetId: _assetId };
}

export function loadGetterTupleWithdraw(source: TupleReader) {
    const _piA = source.readCell();
    const _piB = source.readCell();
    const _piC = source.readCell();
    const _root = source.readBigNumber();
    const _nullifierHash = source.readBigNumber();
    const _recipient = source.readAddress();
    const _assetId = source.readBigNumber();
    return { $$type: 'Withdraw' as const, piA: _piA, piB: _piB, piC: _piC, root: _root, nullifierHash: _nullifierHash, recipient: _recipient, assetId: _assetId };
}

export function storeTupleWithdraw(source: Withdraw) {
    const builder = new TupleBuilder();
    builder.writeCell(source.piA);
    builder.writeCell(source.piB);
    builder.writeCell(source.piC);
    builder.writeNumber(source.root);
    builder.writeNumber(source.nullifierHash);
    builder.writeAddress(source.recipient);
    builder.writeNumber(source.assetId);
    return builder.build();
}

export function dictValueParserWithdraw(): DictionaryValue<Withdraw> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeWithdraw(src)).endCell());
        },
        parse: (src) => {
            return loadWithdraw(src.loadRef().beginParse());
        }
    }
}

export type SetPaused = {
    $$type: 'SetPaused';
    paused: boolean;
}

export function storeSetPaused(src: SetPaused) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4099, 32);
        b_0.storeBit(src.paused);
    };
}

export function loadSetPaused(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4099) { throw Error('Invalid prefix'); }
    const _paused = sc_0.loadBit();
    return { $$type: 'SetPaused' as const, paused: _paused };
}

export function loadTupleSetPaused(source: TupleReader) {
    const _paused = source.readBoolean();
    return { $$type: 'SetPaused' as const, paused: _paused };
}

export function loadGetterTupleSetPaused(source: TupleReader) {
    const _paused = source.readBoolean();
    return { $$type: 'SetPaused' as const, paused: _paused };
}

export function storeTupleSetPaused(source: SetPaused) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.paused);
    return builder.build();
}

export function dictValueParserSetPaused(): DictionaryValue<SetPaused> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetPaused(src)).endCell());
        },
        parse: (src) => {
            return loadSetPaused(src.loadRef().beginParse());
        }
    }
}

export type EmergencyRescue = {
    $$type: 'EmergencyRescue';
    recipient: Address;
    amount: bigint;
    jettonWallet: Address | null;
}

export function storeEmergencyRescue(src: EmergencyRescue) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4100, 32);
        b_0.storeAddress(src.recipient);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.jettonWallet);
    };
}

export function loadEmergencyRescue(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4100) { throw Error('Invalid prefix'); }
    const _recipient = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    const _jettonWallet = sc_0.loadMaybeAddress();
    return { $$type: 'EmergencyRescue' as const, recipient: _recipient, amount: _amount, jettonWallet: _jettonWallet };
}

export function loadTupleEmergencyRescue(source: TupleReader) {
    const _recipient = source.readAddress();
    const _amount = source.readBigNumber();
    const _jettonWallet = source.readAddressOpt();
    return { $$type: 'EmergencyRescue' as const, recipient: _recipient, amount: _amount, jettonWallet: _jettonWallet };
}

export function loadGetterTupleEmergencyRescue(source: TupleReader) {
    const _recipient = source.readAddress();
    const _amount = source.readBigNumber();
    const _jettonWallet = source.readAddressOpt();
    return { $$type: 'EmergencyRescue' as const, recipient: _recipient, amount: _amount, jettonWallet: _jettonWallet };
}

export function storeTupleEmergencyRescue(source: EmergencyRescue) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.recipient);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.jettonWallet);
    return builder.build();
}

export function dictValueParserEmergencyRescue(): DictionaryValue<EmergencyRescue> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeEmergencyRescue(src)).endCell());
        },
        parse: (src) => {
            return loadEmergencyRescue(src.loadRef().beginParse());
        }
    }
}

export type UpgradeCode = {
    $$type: 'UpgradeCode';
    new_code: Cell;
}

export function storeUpgradeCode(src: UpgradeCode) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4101, 32);
        b_0.storeRef(src.new_code);
    };
}

export function loadUpgradeCode(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4101) { throw Error('Invalid prefix'); }
    const _new_code = sc_0.loadRef();
    return { $$type: 'UpgradeCode' as const, new_code: _new_code };
}

export function loadTupleUpgradeCode(source: TupleReader) {
    const _new_code = source.readCell();
    return { $$type: 'UpgradeCode' as const, new_code: _new_code };
}

export function loadGetterTupleUpgradeCode(source: TupleReader) {
    const _new_code = source.readCell();
    return { $$type: 'UpgradeCode' as const, new_code: _new_code };
}

export function storeTupleUpgradeCode(source: UpgradeCode) {
    const builder = new TupleBuilder();
    builder.writeCell(source.new_code);
    return builder.build();
}

export function dictValueParserUpgradeCode(): DictionaryValue<UpgradeCode> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUpgradeCode(src)).endCell());
        },
        parse: (src) => {
            return loadUpgradeCode(src.loadRef().beginParse());
        }
    }
}

export type SetPool = {
    $$type: 'SetPool';
    assetId: bigint;
    denomination: bigint;
    active: boolean;
}

export function storeSetPool(src: SetPool) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4102, 32);
        b_0.storeUint(src.assetId, 256);
        b_0.storeCoins(src.denomination);
        b_0.storeBit(src.active);
    };
}

export function loadSetPool(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4102) { throw Error('Invalid prefix'); }
    const _assetId = sc_0.loadUintBig(256);
    const _denomination = sc_0.loadCoins();
    const _active = sc_0.loadBit();
    return { $$type: 'SetPool' as const, assetId: _assetId, denomination: _denomination, active: _active };
}

export function loadTupleSetPool(source: TupleReader) {
    const _assetId = source.readBigNumber();
    const _denomination = source.readBigNumber();
    const _active = source.readBoolean();
    return { $$type: 'SetPool' as const, assetId: _assetId, denomination: _denomination, active: _active };
}

export function loadGetterTupleSetPool(source: TupleReader) {
    const _assetId = source.readBigNumber();
    const _denomination = source.readBigNumber();
    const _active = source.readBoolean();
    return { $$type: 'SetPool' as const, assetId: _assetId, denomination: _denomination, active: _active };
}

export function storeTupleSetPool(source: SetPool) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.assetId);
    builder.writeNumber(source.denomination);
    builder.writeBoolean(source.active);
    return builder.build();
}

export function dictValueParserSetPool(): DictionaryValue<SetPool> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetPool(src)).endCell());
        },
        parse: (src) => {
            return loadSetPool(src.loadRef().beginParse());
        }
    }
}

export type ClaimFees = {
    $$type: 'ClaimFees';
    amount: bigint;
    destination: Address;
}

export function storeClaimFees(src: ClaimFees) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4103, 32);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.destination);
    };
}

export function loadClaimFees(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4103) { throw Error('Invalid prefix'); }
    const _amount = sc_0.loadCoins();
    const _destination = sc_0.loadAddress();
    return { $$type: 'ClaimFees' as const, amount: _amount, destination: _destination };
}

export function loadTupleClaimFees(source: TupleReader) {
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    return { $$type: 'ClaimFees' as const, amount: _amount, destination: _destination };
}

export function loadGetterTupleClaimFees(source: TupleReader) {
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    return { $$type: 'ClaimFees' as const, amount: _amount, destination: _destination };
}

export function storeTupleClaimFees(source: ClaimFees) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.amount);
    builder.writeAddress(source.destination);
    return builder.build();
}

export function dictValueParserClaimFees(): DictionaryValue<ClaimFees> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeClaimFees(src)).endCell());
        },
        parse: (src) => {
            return loadClaimFees(src.loadRef().beginParse());
        }
    }
}

export type SetFeeRouting = {
    $$type: 'SetFeeRouting';
    autoRoute: boolean;
}

export function storeSetFeeRouting(src: SetFeeRouting) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4104, 32);
        b_0.storeBit(src.autoRoute);
    };
}

export function loadSetFeeRouting(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4104) { throw Error('Invalid prefix'); }
    const _autoRoute = sc_0.loadBit();
    return { $$type: 'SetFeeRouting' as const, autoRoute: _autoRoute };
}

export function loadTupleSetFeeRouting(source: TupleReader) {
    const _autoRoute = source.readBoolean();
    return { $$type: 'SetFeeRouting' as const, autoRoute: _autoRoute };
}

export function loadGetterTupleSetFeeRouting(source: TupleReader) {
    const _autoRoute = source.readBoolean();
    return { $$type: 'SetFeeRouting' as const, autoRoute: _autoRoute };
}

export function storeTupleSetFeeRouting(source: SetFeeRouting) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.autoRoute);
    return builder.build();
}

export function dictValueParserSetFeeRouting(): DictionaryValue<SetFeeRouting> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetFeeRouting(src)).endCell());
        },
        parse: (src) => {
            return loadSetFeeRouting(src.loadRef().beginParse());
        }
    }
}

export type JettonNotification = {
    $$type: 'JettonNotification';
    query_id: bigint;
    amount: bigint;
    sender: Address;
    forward_payload: Slice;
}

export function storeJettonNotification(src: JettonNotification) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1935855772, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.sender);
        b_0.storeBuilder(src.forward_payload.asBuilder());
    };
}

export function loadJettonNotification(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1935855772) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _sender = sc_0.loadAddress();
    const _forward_payload = sc_0;
    return { $$type: 'JettonNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function loadTupleJettonNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'JettonNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function loadGetterTupleJettonNotification(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _sender = source.readAddress();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'JettonNotification' as const, query_id: _query_id, amount: _amount, sender: _sender, forward_payload: _forward_payload };
}

export function storeTupleJettonNotification(source: JettonNotification) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.sender);
    builder.writeSlice(source.forward_payload.asCell());
    return builder.build();
}

export function dictValueParserJettonNotification(): DictionaryValue<JettonNotification> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonNotification(src)).endCell());
        },
        parse: (src) => {
            return loadJettonNotification(src.loadRef().beginParse());
        }
    }
}

export type JettonTransfer = {
    $$type: 'JettonTransfer';
    query_id: bigint;
    amount: bigint;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell | null;
    forward_ton_amount: bigint;
    forward_payload: Slice;
}

export function storeJettonTransfer(src: JettonTransfer) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(260734629, 32);
        b_0.storeUint(src.query_id, 64);
        b_0.storeCoins(src.amount);
        b_0.storeAddress(src.destination);
        b_0.storeAddress(src.response_destination);
        if (src.custom_payload !== null && src.custom_payload !== undefined) { b_0.storeBit(true).storeRef(src.custom_payload); } else { b_0.storeBit(false); }
        b_0.storeCoins(src.forward_ton_amount);
        b_0.storeBuilder(src.forward_payload.asBuilder());
    };
}

export function loadJettonTransfer(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 260734629) { throw Error('Invalid prefix'); }
    const _query_id = sc_0.loadUintBig(64);
    const _amount = sc_0.loadCoins();
    const _destination = sc_0.loadAddress();
    const _response_destination = sc_0.loadAddress();
    const _custom_payload = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _forward_ton_amount = sc_0.loadCoins();
    const _forward_payload = sc_0;
    return { $$type: 'JettonTransfer' as const, query_id: _query_id, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadTupleJettonTransfer(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _response_destination = source.readAddress();
    const _custom_payload = source.readCellOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'JettonTransfer' as const, query_id: _query_id, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function loadGetterTupleJettonTransfer(source: TupleReader) {
    const _query_id = source.readBigNumber();
    const _amount = source.readBigNumber();
    const _destination = source.readAddress();
    const _response_destination = source.readAddress();
    const _custom_payload = source.readCellOpt();
    const _forward_ton_amount = source.readBigNumber();
    const _forward_payload = source.readCell().asSlice();
    return { $$type: 'JettonTransfer' as const, query_id: _query_id, amount: _amount, destination: _destination, response_destination: _response_destination, custom_payload: _custom_payload, forward_ton_amount: _forward_ton_amount, forward_payload: _forward_payload };
}

export function storeTupleJettonTransfer(source: JettonTransfer) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.query_id);
    builder.writeNumber(source.amount);
    builder.writeAddress(source.destination);
    builder.writeAddress(source.response_destination);
    builder.writeCell(source.custom_payload);
    builder.writeNumber(source.forward_ton_amount);
    builder.writeSlice(source.forward_payload.asCell());
    return builder.build();
}

export function dictValueParserJettonTransfer(): DictionaryValue<JettonTransfer> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeJettonTransfer(src)).endCell());
        },
        parse: (src) => {
            return loadJettonTransfer(src.loadRef().beginParse());
        }
    }
}

export type DepositEvent = {
    $$type: 'DepositEvent';
    assetId: bigint;
    commitment: bigint;
    leafIndex: bigint;
    newRoot: bigint;
}

export function storeDepositEvent(src: DepositEvent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1405715012, 32);
        b_0.storeUint(src.assetId, 256);
        b_0.storeUint(src.commitment, 256);
        b_0.storeUint(src.leafIndex, 32);
        b_0.storeUint(src.newRoot, 256);
    };
}

export function loadDepositEvent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1405715012) { throw Error('Invalid prefix'); }
    const _assetId = sc_0.loadUintBig(256);
    const _commitment = sc_0.loadUintBig(256);
    const _leafIndex = sc_0.loadUintBig(32);
    const _newRoot = sc_0.loadUintBig(256);
    return { $$type: 'DepositEvent' as const, assetId: _assetId, commitment: _commitment, leafIndex: _leafIndex, newRoot: _newRoot };
}

export function loadTupleDepositEvent(source: TupleReader) {
    const _assetId = source.readBigNumber();
    const _commitment = source.readBigNumber();
    const _leafIndex = source.readBigNumber();
    const _newRoot = source.readBigNumber();
    return { $$type: 'DepositEvent' as const, assetId: _assetId, commitment: _commitment, leafIndex: _leafIndex, newRoot: _newRoot };
}

export function loadGetterTupleDepositEvent(source: TupleReader) {
    const _assetId = source.readBigNumber();
    const _commitment = source.readBigNumber();
    const _leafIndex = source.readBigNumber();
    const _newRoot = source.readBigNumber();
    return { $$type: 'DepositEvent' as const, assetId: _assetId, commitment: _commitment, leafIndex: _leafIndex, newRoot: _newRoot };
}

export function storeTupleDepositEvent(source: DepositEvent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.assetId);
    builder.writeNumber(source.commitment);
    builder.writeNumber(source.leafIndex);
    builder.writeNumber(source.newRoot);
    return builder.build();
}

export function dictValueParserDepositEvent(): DictionaryValue<DepositEvent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDepositEvent(src)).endCell());
        },
        parse: (src) => {
            return loadDepositEvent(src.loadRef().beginParse());
        }
    }
}

export type WithdrawalEvent = {
    $$type: 'WithdrawalEvent';
    assetId: bigint;
    nullifierHash: bigint;
    recipient: Address;
    amount: bigint;
    fee: bigint;
}

export function storeWithdrawalEvent(src: WithdrawalEvent) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(938346725, 32);
        b_0.storeUint(src.assetId, 256);
        b_0.storeUint(src.nullifierHash, 256);
        b_0.storeAddress(src.recipient);
        b_0.storeCoins(src.amount);
        const b_1 = new Builder();
        b_1.storeCoins(src.fee);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadWithdrawalEvent(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 938346725) { throw Error('Invalid prefix'); }
    const _assetId = sc_0.loadUintBig(256);
    const _nullifierHash = sc_0.loadUintBig(256);
    const _recipient = sc_0.loadAddress();
    const _amount = sc_0.loadCoins();
    const sc_1 = sc_0.loadRef().beginParse();
    const _fee = sc_1.loadCoins();
    return { $$type: 'WithdrawalEvent' as const, assetId: _assetId, nullifierHash: _nullifierHash, recipient: _recipient, amount: _amount, fee: _fee };
}

export function loadTupleWithdrawalEvent(source: TupleReader) {
    const _assetId = source.readBigNumber();
    const _nullifierHash = source.readBigNumber();
    const _recipient = source.readAddress();
    const _amount = source.readBigNumber();
    const _fee = source.readBigNumber();
    return { $$type: 'WithdrawalEvent' as const, assetId: _assetId, nullifierHash: _nullifierHash, recipient: _recipient, amount: _amount, fee: _fee };
}

export function loadGetterTupleWithdrawalEvent(source: TupleReader) {
    const _assetId = source.readBigNumber();
    const _nullifierHash = source.readBigNumber();
    const _recipient = source.readAddress();
    const _amount = source.readBigNumber();
    const _fee = source.readBigNumber();
    return { $$type: 'WithdrawalEvent' as const, assetId: _assetId, nullifierHash: _nullifierHash, recipient: _recipient, amount: _amount, fee: _fee };
}

export function storeTupleWithdrawalEvent(source: WithdrawalEvent) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.assetId);
    builder.writeNumber(source.nullifierHash);
    builder.writeAddress(source.recipient);
    builder.writeNumber(source.amount);
    builder.writeNumber(source.fee);
    return builder.build();
}

export function dictValueParserWithdrawalEvent(): DictionaryValue<WithdrawalEvent> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeWithdrawalEvent(src)).endCell());
        },
        parse: (src) => {
            return loadWithdrawalEvent(src.loadRef().beginParse());
        }
    }
}

export type TonZkMixer$Data = {
    $$type: 'TonZkMixer$Data';
    owner: Address;
    paused: boolean;
    tonDenomination: bigint;
    poolDenominations: Dictionary<bigint, bigint>;
    poolActive: Dictionary<bigint, boolean>;
    assetToWallet: Dictionary<bigint, Address>;
    nextIndex: bigint;
    currentRoot: bigint;
    filledSubtrees: Dictionary<number, bigint>;
    roots: Dictionary<bigint, boolean>;
    nullifiers: Dictionary<bigint, boolean>;
    totalDeposits: bigint;
    totalWithdrawals: bigint;
    accumulatedFees: bigint;
    autoFeeRouting: boolean;
}

export function storeTonZkMixer$Data(src: TonZkMixer$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeBit(src.paused);
        b_0.storeCoins(src.tonDenomination);
        b_0.storeDict(src.poolDenominations, Dictionary.Keys.BigUint(256), Dictionary.Values.BigVarUint(4));
        b_0.storeDict(src.poolActive, Dictionary.Keys.BigUint(256), Dictionary.Values.Bool());
        const b_1 = new Builder();
        b_1.storeDict(src.assetToWallet, Dictionary.Keys.BigUint(256), Dictionary.Values.Address());
        b_1.storeUint(src.nextIndex, 32);
        b_1.storeUint(src.currentRoot, 256);
        b_1.storeDict(src.filledSubtrees, Dictionary.Keys.Uint(8), Dictionary.Values.BigUint(256));
        b_1.storeDict(src.roots, Dictionary.Keys.BigUint(256), Dictionary.Values.Bool());
        b_1.storeDict(src.nullifiers, Dictionary.Keys.BigUint(256), Dictionary.Values.Bool());
        b_1.storeUint(src.totalDeposits, 32);
        b_1.storeUint(src.totalWithdrawals, 32);
        b_1.storeCoins(src.accumulatedFees);
        b_1.storeBit(src.autoFeeRouting);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadTonZkMixer$Data(slice: Slice) {
    const sc_0 = slice;
    const _owner = sc_0.loadAddress();
    const _paused = sc_0.loadBit();
    const _tonDenomination = sc_0.loadCoins();
    const _poolDenominations = Dictionary.load(Dictionary.Keys.BigUint(256), Dictionary.Values.BigVarUint(4), sc_0);
    const _poolActive = Dictionary.load(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool(), sc_0);
    const sc_1 = sc_0.loadRef().beginParse();
    const _assetToWallet = Dictionary.load(Dictionary.Keys.BigUint(256), Dictionary.Values.Address(), sc_1);
    const _nextIndex = sc_1.loadUintBig(32);
    const _currentRoot = sc_1.loadUintBig(256);
    const _filledSubtrees = Dictionary.load(Dictionary.Keys.Uint(8), Dictionary.Values.BigUint(256), sc_1);
    const _roots = Dictionary.load(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool(), sc_1);
    const _nullifiers = Dictionary.load(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool(), sc_1);
    const _totalDeposits = sc_1.loadUintBig(32);
    const _totalWithdrawals = sc_1.loadUintBig(32);
    const _accumulatedFees = sc_1.loadCoins();
    const _autoFeeRouting = sc_1.loadBit();
    return { $$type: 'TonZkMixer$Data' as const, owner: _owner, paused: _paused, tonDenomination: _tonDenomination, poolDenominations: _poolDenominations, poolActive: _poolActive, assetToWallet: _assetToWallet, nextIndex: _nextIndex, currentRoot: _currentRoot, filledSubtrees: _filledSubtrees, roots: _roots, nullifiers: _nullifiers, totalDeposits: _totalDeposits, totalWithdrawals: _totalWithdrawals, accumulatedFees: _accumulatedFees, autoFeeRouting: _autoFeeRouting };
}

export function loadTupleTonZkMixer$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _paused = source.readBoolean();
    const _tonDenomination = source.readBigNumber();
    const _poolDenominations = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigVarUint(4), source.readCellOpt());
    const _poolActive = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool(), source.readCellOpt());
    const _assetToWallet = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Address(), source.readCellOpt());
    const _nextIndex = source.readBigNumber();
    const _currentRoot = source.readBigNumber();
    const _filledSubtrees = Dictionary.loadDirect(Dictionary.Keys.Uint(8), Dictionary.Values.BigUint(256), source.readCellOpt());
    const _roots = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool(), source.readCellOpt());
    const _nullifiers = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool(), source.readCellOpt());
    const _totalDeposits = source.readBigNumber();
    const _totalWithdrawals = source.readBigNumber();
    const _accumulatedFees = source.readBigNumber();
    const _autoFeeRouting = source.readBoolean();
    return { $$type: 'TonZkMixer$Data' as const, owner: _owner, paused: _paused, tonDenomination: _tonDenomination, poolDenominations: _poolDenominations, poolActive: _poolActive, assetToWallet: _assetToWallet, nextIndex: _nextIndex, currentRoot: _currentRoot, filledSubtrees: _filledSubtrees, roots: _roots, nullifiers: _nullifiers, totalDeposits: _totalDeposits, totalWithdrawals: _totalWithdrawals, accumulatedFees: _accumulatedFees, autoFeeRouting: _autoFeeRouting };
}

export function loadGetterTupleTonZkMixer$Data(source: TupleReader) {
    const _owner = source.readAddress();
    const _paused = source.readBoolean();
    const _tonDenomination = source.readBigNumber();
    const _poolDenominations = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigVarUint(4), source.readCellOpt());
    const _poolActive = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool(), source.readCellOpt());
    const _assetToWallet = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Address(), source.readCellOpt());
    const _nextIndex = source.readBigNumber();
    const _currentRoot = source.readBigNumber();
    const _filledSubtrees = Dictionary.loadDirect(Dictionary.Keys.Uint(8), Dictionary.Values.BigUint(256), source.readCellOpt());
    const _roots = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool(), source.readCellOpt());
    const _nullifiers = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool(), source.readCellOpt());
    const _totalDeposits = source.readBigNumber();
    const _totalWithdrawals = source.readBigNumber();
    const _accumulatedFees = source.readBigNumber();
    const _autoFeeRouting = source.readBoolean();
    return { $$type: 'TonZkMixer$Data' as const, owner: _owner, paused: _paused, tonDenomination: _tonDenomination, poolDenominations: _poolDenominations, poolActive: _poolActive, assetToWallet: _assetToWallet, nextIndex: _nextIndex, currentRoot: _currentRoot, filledSubtrees: _filledSubtrees, roots: _roots, nullifiers: _nullifiers, totalDeposits: _totalDeposits, totalWithdrawals: _totalWithdrawals, accumulatedFees: _accumulatedFees, autoFeeRouting: _autoFeeRouting };
}

export function storeTupleTonZkMixer$Data(source: TonZkMixer$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.owner);
    builder.writeBoolean(source.paused);
    builder.writeNumber(source.tonDenomination);
    builder.writeCell(source.poolDenominations.size > 0 ? beginCell().storeDictDirect(source.poolDenominations, Dictionary.Keys.BigUint(256), Dictionary.Values.BigVarUint(4)).endCell() : null);
    builder.writeCell(source.poolActive.size > 0 ? beginCell().storeDictDirect(source.poolActive, Dictionary.Keys.BigUint(256), Dictionary.Values.Bool()).endCell() : null);
    builder.writeCell(source.assetToWallet.size > 0 ? beginCell().storeDictDirect(source.assetToWallet, Dictionary.Keys.BigUint(256), Dictionary.Values.Address()).endCell() : null);
    builder.writeNumber(source.nextIndex);
    builder.writeNumber(source.currentRoot);
    builder.writeCell(source.filledSubtrees.size > 0 ? beginCell().storeDictDirect(source.filledSubtrees, Dictionary.Keys.Uint(8), Dictionary.Values.BigUint(256)).endCell() : null);
    builder.writeCell(source.roots.size > 0 ? beginCell().storeDictDirect(source.roots, Dictionary.Keys.BigUint(256), Dictionary.Values.Bool()).endCell() : null);
    builder.writeCell(source.nullifiers.size > 0 ? beginCell().storeDictDirect(source.nullifiers, Dictionary.Keys.BigUint(256), Dictionary.Values.Bool()).endCell() : null);
    builder.writeNumber(source.totalDeposits);
    builder.writeNumber(source.totalWithdrawals);
    builder.writeNumber(source.accumulatedFees);
    builder.writeBoolean(source.autoFeeRouting);
    return builder.build();
}

export function dictValueParserTonZkMixer$Data(): DictionaryValue<TonZkMixer$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTonZkMixer$Data(src)).endCell());
        },
        parse: (src) => {
            return loadTonZkMixer$Data(src.loadRef().beginParse());
        }
    }
}

 type TonZkMixer_init_args = {
    $$type: 'TonZkMixer_init_args';
    owner: Address;
    tonDenomination: bigint;
}

function initTonZkMixer_init_args(src: TonZkMixer_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.owner);
        b_0.storeCoins(src.tonDenomination);
    };
}

async function TonZkMixer_init(owner: Address, tonDenomination: bigint) {
    const __code = Cell.fromHex('b5ee9c7241026101001612000114ff00f4a413f4bcf2c80b01020162022f03f4d001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200018e2ffa40d200fa00f404d401d0f404f404d31fd3fff404d430d0f404f404d31fd31ffa00d2003010bf10be10bd10bc6c1f8e8afa40fa005902d101db3ce21110935f0f30e0702fd74920c21f96310fd31f1110de21811001bae302215a030503fa5b0ed3ff302cb3f2e3ea278307b9f2e3ec2b10ef0d0e10bc10ab109a108910781067105610451034401301111001db3c53d0a0f8416f24135f0301baf2e3eb12a02810ef10df10cf10bf10af0f09080706050443135610db3c04a47003021112020111110105c85530821053c982445005cb1f13cbffcbffcb1fcbffc960090400d4c88258c000000000000000000000000101cb67ccc970fb0010ce10bd10ac109b108a107910681057104610354014c87f01ca0055e050efce1cca00500afa0218f40006c8f40015f40013cb1fcbfff40001c8f40013f40013cb1f13cb1f5003fa0213ca0012cdcdc9ed5404ea82107362d09cbae30221811002bae30221811003ba8e515b3c0dd20030f8422dc705f2e3e910ce0d10ac5519c87f01ca0055e050efce1cca00500afa0218f40006c8f40015f40013cb1fcbfff40001c8f40013f40013cb1f13cb1f5003fa0213ca0012cdcdc9ed54e021811006bae30221811004ba0613252603fc5b0ed33f31fa00fa40312db3f2e3ea288307b9f2e3ecf84220db3c2c830722714133f40e6fa19401d70030925b6de2206e92307f91b3e28e22312c83072259f40e6fa193fa003092306de2206eb39213ba93303270e2f2e3eb50a9e30d09d3ff302810ef10df10cf10bf102a10291028102710261025102410230111100114070800880c83072d7f71216e955b59f45b3098c801cf004133f443e21d83075420d5206e953059f45b3098c801fa024133f443e21a83075420ce206e953059f45b30944133f416e202b411115610db3c04a403111003021111020111120104c85530821053c982445005cb1f13cbffcbffcb1fcbffc9c88258c000000000000000000000000101cb67ccc970fb0010be10ad109c108b107a106910581047103645135042092b014a2970788ae45b3808a427068307297f71216e955b59f45b3098c801cf004133f443e20650980a03fa21a938008f6f097853a38307216e955b59f45b3098c801cf014133f443e20e11110e0d11100d10cf0b11110b0a11100a109f08111108071110070605111105041110040302111102011110012fdb3c01111201db3c0e11110e0d11100d10cf10be10ad109c108b107a106910581047103645401023e30d01ab0002a4120b111004d020923070e120c0018e233082f03b29ded4e21ee5319d4b13e0f95d442291d511ae4ab3f1c1795b895af9d72352e020c0028e233082f06e1cb2a03731a299466227ee240879935c1b6ff81374b21a2b293edef93045efe020c003e30220c004e30220c005e302c0060c0d0e0f00463082f04b874ed57b5d556715d986b730cb5c1248c3acca96e30f1d82b43990e9370cca00463082f01aacbdbb0a53d2f434e1e637ebceb71c5747fbda734faa4edea850ff68db64bd00463082f02c6d7d2ce39e5804001ec9dc01dbd0f58c6530b6d783573d5aebda842787b90a008e8e2282f03b011a8c6358df04086c7eea4f30b3be04f1b9f869e35884a63b6fc3c1d278bae082f021b968e6d26180f1d4fe126ff3407917683138808c04cdae72eda1db350528b6013029782283074133f40e6fa19401d70130925b6de25003db3c110104db3c1200907082305851f42d4c957f2d823014057b7ef767814ff9303180408e245154a025a90823a025a908547005a9885306a9885116a988543325a98821a025a9080305e46c3159a001a90802fc5b0ed4d4d430d0d4d3ffd3fffa40d430d0d3ff305612b3f2e3ea29830724714133f40e6fa19401d70030925b6de2206e92307f91b3e2f2e3ee2a830725714133f40e6fa19401d70030925b6de2206eb3923070dff2e3ed2f830722714133f40e6fa19401d70030925b6de2206eb3923070dff2e3f021db3c11131114111314150024c801cf16c9d0800bd721d3ff30f93031a90804fa1112111411121111111411111110111411100f11140f0e11140e0d11140d0c11140c0b11140b0a11140a0911140908111408071114070611150605111605041114040311150302111602011114015615015615db3cf2e3ef04830756117f71216e955b59f45b3098c801cf004133f443e202a470205611e30f041111041620222404de06d7393005d7393004d7393025d749810180bd917f9724d749810300bde2917f9720d749810180bde2935f0770e025f93017c000917f9624f93027c000e2917f9620f93017c000e2935f0770e025f93018c300917f9624f93028c300e2917f9620f93018c300e2935f0770e08989891718191a0060b6bb6d1eb1e9780c65c0f2b4af7bfcb71cee6af3bf7c8e2cdface6e06afd3a0c8daff816e6c2ff65380b1ca42c3a16f60060b2fe2cb319bf7361635d963d2f38ab668782a3aba2f08d2493091a4f5ac7d5187e4d29b691cfc88d2ec13b30150a37010060a0a82f08502e1c902014e90734970cd0d94c368ffc96de2c7a45ba886f6a22026cc6504b80bccd70c5623f94bb49a13304f889103710364503040a74f930148d0c23a8ade4bf9652ba55e528ea7e664e436d56240475c879e397f9983481b7a990b45c0505e9dbec138e2c3dbd605b92c760f9301002f9301289898d0c24df7f49be9874ba587300066b72407c3b2dbd027c734ecabf1c82beeb290bc4d9c703113f5be349f06be21854735592201b1c1d1e0060a87c499577747f8c65568ef6c211b45ba3ef7a5cb7d29aa35c672a50247769696e7fc906648a45e2f780388a3a2dddd700c093e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb800c087e3f16ce1380378128d6f5bae70bb65eb28dfd5bc38a8e4225fd52c40d64be21c7fe5e1705601d484dfe3114bf0ebe60a1d166e81cde814ec3b3c870a4f33a88478e09a0799d648a5d205522b74eb5c77ad6857a2c5ac42ae643901c02b317901168910675e2374f93030c3001f00c080b61272470f2c76aaf8fee9838e01d367807d80037af69c196c450498336824ecc4ba6073bfd2e2a015816826f7f3de1300f0483130e69764278d6185eb448436fa4d325bfa83ac2ca3d4f7d5690fcee8853f689c7c97706feb4680038e7339012a2b8307561359f40e6fa192306ddf206eb39130e30d2100f8312d8307561359f40e6fa193fa003092306de2820a625a0072246d718b082603561b03561c03c8556082100f8a7ea55008cb1f16cb3f5004fa0212cecef40001fa02cec910345a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb000184302d72708856165134413310246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0023004600000000546f6e5a6b4d6978657220416e6f6e796d6f7573205769746864726177616c01a8031112030211130201c85540821037ee08e55006cb1f14cbff12cbffce01fa02c858fa02cdc9c88258c000000000000000000000000101cb67ccc970fb0010be10ad109c108b107a1069105810471036451350442b01aa5b0ed3fffa00d20030f8425610c705f2e3e91b8307523271216e955b59f45b3098c801cf004133f443e20b8307532b206e953059f45b3098c801fa024133f443e2019139933b108ae210ce10bd10ac5e28107955162b04ce8fdf5b0efa40fa00d72c01916d93fa4001e231f8425610c705f2e3e9206e8ebb3072708810246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00e30e10ce551be021811007ba27282b29004600000000546f6e5a6b4d6978657220456d657267656e637920544f4e2052657363756500d4820afaf08072706d718b08281046105804095520c8556082100f8a7ea55008cb1f16cb3f5004fa0212cecef40001fa02cec943305a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0004da8f5e5b0efa00fa4030f8422fc705f2e3e9531fbbf2e3f151f1a1727088041112040311120310246d50436d03c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb0010ce551be021811008bae30221811005ba2a2b2c2d003200000000546f6e5a6b4d6978657220436c61696d20466565730078c87f01ca0055e050efce1cca00500afa0218f40006c8f40015f40013cb1fcbfff40001c8f40013f40013cb1f13cb1f5003fa0213ca0012cdcdc9ed5400c25b3f0dd20030f8422dc705f2e3e910ce10bd10ac109b108a10791068105710461035443012c87f01ca0055e050efce1cca00500afa0218f40006c8f40015f40013cb1fcbfff40001c8f40013f40013cb1f13cb1f5003fa0213ca0012cdcdc9ed5401c28e4e5b0ed430f8422ec705f2e3e9fb0410ce551bc87f01ca0055e050efce1cca00500afa0218f40006c8f40015f40013cb1fcbfff40001c8f40013f40013cb1f13cb1f5003fa0213ca0012cdcdc9ed54e05710c0000fc1211fb0e3025f0ff2c0822e008010ce551bc87f01ca0055e050efce1cca00500afa0218f40006c8f40015f40013cb1fcbfff40001c8f40013f40013cb1f13cb1f5003fa0213ca0012cdcdc9ed540201203044020120313c020120323a02012033350295b15bfb5134348000638bfe9034803e803d013500743d013d0134c7f4fffd01350c343d013d0134c7f4c7fe8034800c042fc42f842f442f1b07e3a2be903e801640b44076cf38b6cf1b3c605a3400022102012036380295ae6976a268690000c717fd2069007d007a026a00e87a027a02698fe9fffa026a18687a027a02698fe98ffd00690018085f885f085e885e360fc7457d207d002c816880ed9e716d9e3678c05a370002280295adc9f6a268690000c717fd2069007d007a026a00e87a027a02698fe9fffa026a18687a027a02698fe98ffd00690018085f885f085e885e360fc7457d207d002c816880ed9e716d9e3678c05a390002230295b7cf1da89a1a400031c5ff481a401f401e809a803a1e809e809a63fa7ffe809a861a1e809e809a63fa63ff401a40060217e217c217a2178d83f1d15f481f400b205a203b679c5b678d9e305a3b0002710201203d420201203e400295b1477b5134348000638bfe9034803e803d013500743d013d0134c7f4fffd01350c343d013d0134c7f4c7fe8034800c042fc42f842f442f1b07e3a2be903e801640b44076cf38b6cf1b3c605a3f00022e0295b08ebb5134348000638bfe9034803e803d013500743d013d0134c7f4fffd01350c343d013d0134c7f4c7fe8034800c042fc42f842f442f1b07e3a2be903e801640b44076cf38b6cf1b3c605a410002270295b5defda89a1a400031c5ff481a401f401e809a803a1e809e809a63fa7ffe809a861a1e809e809a63fa63ff401a40060217e217c217a2178d83f1d15f481f400b205a203b679c5b678d9e305a43001af8276f105302bc9222a1e030700201584553020120464b02012047490299ae1976a268690000c717fd2069007d007a026a00e87a027a02698fe9fffa026a18687a027a02698fe98ffd00690018085f885f085e885e360fc7457d207d002c816880ed9e712a876d9e3678c05a48002e83072d0259f40e6fa193fa003092306de2206eb3dc30700295ae7976a268690000c717fd2069007d007a026a00e87a027a02698fe9fffa026a18687a027a02698fe98ffd00690018085f885f085e885e360fc7457d207d002c816880ed9e716d9e3678c05a4a00488d086007785230b66f85dc6feba8981465f97fc2d44a83d2db61f48b8e04d035b118e8540201584c510201204d4f0293a6d3da89a1a400031c5ff481a401f401e809a803a1e809e809a63fa7ffe809a861a1e809e809a63fa63ff401a40060217e217c217a2178d83f1d15f481f400b205a203b679c5b678d9e35a4e0002220297a573da89a1a400031c5ff481a401f401e809a803a1e809e809a63fa7ffe809a861a1e809e809a63fa63ff401a40060217e217c217a2178d83f1d15f481f400b205a203b679c4aa1db678d9e35a50003683072702714133f40e6fa19401d70030925b6de2206eb3923070df0294a8c5ed44d0d200018e2ffa40d200fa00f404d401d0f404f404d31fd3fff404d430d0f404f404d31fd31ffa00d2003010bf10be10bd10bc6c1f8e8afa40fa005902d101db3ce2db3c6cf15a5200022002012054560295b337bb5134348000638bfe9034803e803d013500743d013d0134c7f4fffd01350c343d013d0134c7f4c7fe8034800c042fc42f842f442f1b07e3a2be903e801640b44076cf38b6cf1b3c605a5500022d02015857590298a8f8ed44d0d200018e2ffa40d200fa00f404d401d0f404f404d31fd3fff404d430d0f404f404d31fd31ffa00d2003010bf10be10bd10bc6c1f8e8afa40fa005902d101db3ce2550edb3c6cf15a58003683072602714133f40e6fa19401d70030925b6de2206eb3923070df0298a8e1ed44d0d200018e2ffa40d200fa00f404d401d0f404f404d31fd3fff404d430d0f404f404d31fd31ffa00d2003010bf10be10bd10bc6c1f8e8afa40fa005902d101db3ce2550edb3c6cf15a5f01c46d6d6d6d6d6d7027705470007082f03f194414241d31d80fb05371ffb726043b92e9c8ee821b5cbd22d8c499a0b0140983072a7f71216e955b59f45b3098c801cf004133f443e2785333103d8307216e955b59f45b3098c801cf014133f443e278715b01e082f03b29ded4e21ee5319d4b13e0f95d442291d511ae4ab3f1c1795b895af9d723528307216e955b59f45b3098c801cf014133f443e2787282f06e1cb2a03731a299466227ee240879935c1b6ff81374b21a2b293edef93045ef8307216e955b59f45b3098c801cf014133f443e278735c01e082f04b874ed57b5d556715d986b730cb5c1248c3acca96e30f1d82b43990e9370cca8307216e955b59f45b3098c801cf014133f443e2787482f01aacbdbb0a53d2f434e1e637ebceb71c5747fbda734faa4edea850ff68db64bd8307216e955b59f45b3098c801cf014133f443e278755d01e082f02c6d7d2ce39e5804001ec9dc01dbd0f58c6530b6d783573d5aebda842787b90a8307216e955b59f45b3098c801cf014133f443e2787682f03b011a8c6358df04086c7eea4f30b3be04f1b9f869e35884a63b6fc3c1d278ba8307216e955b59f45b3098c801cf014133f443e278775e00f082f021b968e6d26180f1d4fe126ff3407917683138808c04cdae72eda1db350528b68307216e955b59f45b3098c801cf014133f443e28307541d037f71216e955b59f45b3098c801cf004133f443e2541d028307021110206e953059f45b3098c801fa024133f443e2106d105c0b106a10691048104706050104db3c6000ba2082103b9aca00ba917f982082103b9aca00bae2973082100bebc200e0208212540be400ba917f98208212540be400bae2973082101dcd6500e0208218174876e800ba917f99208218174876e800bae29730821077359400e08032a90477798268');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initTonZkMixer_init_args({ $$type: 'TonZkMixer_init_args', owner, tonDenomination })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const TonZkMixer_errors = {
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

export const TonZkMixer_errors_backward = {
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

const TonZkMixer_types: ABIType[] = [
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
    {"name":"DepositTon","header":4097,"fields":[{"name":"commitment","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"Withdraw","header":4098,"fields":[{"name":"piA","type":{"kind":"simple","type":"cell","optional":false}},{"name":"piB","type":{"kind":"simple","type":"cell","optional":false}},{"name":"piC","type":{"kind":"simple","type":"cell","optional":false}},{"name":"root","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"nullifierHash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"recipient","type":{"kind":"simple","type":"address","optional":false}},{"name":"assetId","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"SetPaused","header":4099,"fields":[{"name":"paused","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"EmergencyRescue","header":4100,"fields":[{"name":"recipient","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"jettonWallet","type":{"kind":"simple","type":"address","optional":true}}]},
    {"name":"UpgradeCode","header":4101,"fields":[{"name":"new_code","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"SetPool","header":4102,"fields":[{"name":"assetId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"denomination","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"active","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"ClaimFees","header":4103,"fields":[{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"destination","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"SetFeeRouting","header":4104,"fields":[{"name":"autoRoute","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"JettonNotification","header":1935855772,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"forward_payload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"JettonTransfer","header":260734629,"fields":[{"name":"query_id","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"response_destination","type":{"kind":"simple","type":"address","optional":false}},{"name":"custom_payload","type":{"kind":"simple","type":"cell","optional":true}},{"name":"forward_ton_amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"forward_payload","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"DepositEvent","header":1405715012,"fields":[{"name":"assetId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"commitment","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"leafIndex","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"newRoot","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"WithdrawalEvent","header":938346725,"fields":[{"name":"assetId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"nullifierHash","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"recipient","type":{"kind":"simple","type":"address","optional":false}},{"name":"amount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"fee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"TonZkMixer$Data","header":null,"fields":[{"name":"owner","type":{"kind":"simple","type":"address","optional":false}},{"name":"paused","type":{"kind":"simple","type":"bool","optional":false}},{"name":"tonDenomination","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"poolDenominations","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"uint","valueFormat":"coins"}},{"name":"poolActive","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"bool"}},{"name":"assetToWallet","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"address"}},{"name":"nextIndex","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"currentRoot","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"filledSubtrees","type":{"kind":"dict","key":"uint","keyFormat":8,"value":"uint","valueFormat":256}},{"name":"roots","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"bool"}},{"name":"nullifiers","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"bool"}},{"name":"totalDeposits","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"totalWithdrawals","type":{"kind":"simple","type":"uint","optional":false,"format":32}},{"name":"accumulatedFees","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"autoFeeRouting","type":{"kind":"simple","type":"bool","optional":false}}]},
]

const TonZkMixer_opcodes = {
    "DepositTon": 4097,
    "Withdraw": 4098,
    "SetPaused": 4099,
    "EmergencyRescue": 4100,
    "UpgradeCode": 4101,
    "SetPool": 4102,
    "ClaimFees": 4103,
    "SetFeeRouting": 4104,
    "JettonNotification": 1935855772,
    "JettonTransfer": 260734629,
    "DepositEvent": 1405715012,
    "WithdrawalEvent": 938346725,
}

const TonZkMixer_getters: ABIGetter[] = [
    {"name":"isKnownRoot","methodId":121529,"arguments":[{"name":"root","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"bool","optional":false}},
    {"name":"isNullifierSpent","methodId":129272,"arguments":[{"name":"nullifierHash","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"bool","optional":false}},
    {"name":"currentRoot","methodId":86586,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"nextIndex","methodId":70866,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"isPaused","methodId":126174,"arguments":[],"returnType":{"kind":"simple","type":"bool","optional":false}},
    {"name":"owner","methodId":83229,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"totalDeposits","methodId":72595,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"totalWithdrawals","methodId":121193,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"poolDenomination","methodId":115762,"arguments":[{"name":"assetId","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"protocolFeePercent","methodId":81528,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"adminFeeWallet","methodId":118002,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"accumulatedFees","methodId":66927,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"upfrontFee","methodId":130273,"arguments":[{"name":"denomination","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"userTvl","methodId":93943,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"autoFeeRouting","methodId":122053,"arguments":[],"returnType":{"kind":"simple","type":"bool","optional":false}},
]

export const TonZkMixer_getterMapping: { [key: string]: string } = {
    'isKnownRoot': 'getIsKnownRoot',
    'isNullifierSpent': 'getIsNullifierSpent',
    'currentRoot': 'getCurrentRoot',
    'nextIndex': 'getNextIndex',
    'isPaused': 'getIsPaused',
    'owner': 'getOwner',
    'totalDeposits': 'getTotalDeposits',
    'totalWithdrawals': 'getTotalWithdrawals',
    'poolDenomination': 'getPoolDenomination',
    'protocolFeePercent': 'getProtocolFeePercent',
    'adminFeeWallet': 'getAdminFeeWallet',
    'accumulatedFees': 'getAccumulatedFees',
    'upfrontFee': 'getUpfrontFee',
    'userTvl': 'getUserTvl',
    'autoFeeRouting': 'getAutoFeeRouting',
}

const TonZkMixer_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"empty"}},
    {"receiver":"internal","message":{"kind":"typed","type":"DepositTon"}},
    {"receiver":"internal","message":{"kind":"typed","type":"JettonNotification"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Withdraw"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetPaused"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetPool"}},
    {"receiver":"internal","message":{"kind":"typed","type":"EmergencyRescue"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ClaimFees"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetFeeRouting"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UpgradeCode"}},
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
export const ERR_NOT_OWNER = 1001n;
export const ERR_PAUSED = 1002n;
export const ERR_INVALID_AMOUNT = 1003n;
export const ERR_TREE_FULL = 1004n;
export const ERR_UNKNOWN_ROOT = 1005n;
export const ERR_NULLIFIER_SPENT = 1006n;
export const ERR_INVALID_PROOF = 1007n;
export const ERR_POOL_INACTIVE = 1008n;
export const ERR_INSUFFICIENT_FEES = 1009n;

export class TonZkMixer implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = TonZkMixer_errors_backward;
    public static readonly opcodes = TonZkMixer_opcodes;
    
    static async init(owner: Address, tonDenomination: bigint) {
        return await TonZkMixer_init(owner, tonDenomination);
    }
    
    static async fromInit(owner: Address, tonDenomination: bigint) {
        const __gen_init = await TonZkMixer_init(owner, tonDenomination);
        const address = contractAddress(0, __gen_init);
        return new TonZkMixer(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new TonZkMixer(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  TonZkMixer_types,
        getters: TonZkMixer_getters,
        receivers: TonZkMixer_receivers,
        errors: TonZkMixer_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: null | DepositTon | JettonNotification | Withdraw | SetPaused | SetPool | EmergencyRescue | ClaimFees | SetFeeRouting | UpgradeCode) {
        
        let body: Cell | null = null;
        if (message === null) {
            body = new Cell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'DepositTon') {
            body = beginCell().store(storeDepositTon(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'JettonNotification') {
            body = beginCell().store(storeJettonNotification(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Withdraw') {
            body = beginCell().store(storeWithdraw(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetPaused') {
            body = beginCell().store(storeSetPaused(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetPool') {
            body = beginCell().store(storeSetPool(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'EmergencyRescue') {
            body = beginCell().store(storeEmergencyRescue(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ClaimFees') {
            body = beginCell().store(storeClaimFees(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetFeeRouting') {
            body = beginCell().store(storeSetFeeRouting(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpgradeCode') {
            body = beginCell().store(storeUpgradeCode(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getIsKnownRoot(provider: ContractProvider, root: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(root);
        const source = (await provider.get('isKnownRoot', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
    async getIsNullifierSpent(provider: ContractProvider, nullifierHash: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(nullifierHash);
        const source = (await provider.get('isNullifierSpent', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
    async getCurrentRoot(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('currentRoot', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getNextIndex(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('nextIndex', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getIsPaused(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('isPaused', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
    async getOwner(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('owner', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getTotalDeposits(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('totalDeposits', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getTotalWithdrawals(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('totalWithdrawals', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getPoolDenomination(provider: ContractProvider, assetId: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(assetId);
        const source = (await provider.get('poolDenomination', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getProtocolFeePercent(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('protocolFeePercent', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getAdminFeeWallet(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('adminFeeWallet', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getAccumulatedFees(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('accumulatedFees', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getUpfrontFee(provider: ContractProvider, denomination: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(denomination);
        const source = (await provider.get('upfrontFee', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getUserTvl(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('userTvl', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getAutoFeeRouting(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('autoFeeRouting', builder.build())).stack;
        const result = source.readBoolean();
        return result;
    }
    
}