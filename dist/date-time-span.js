import { __esDecorate, __runInitializers } from "tslib";
import { given } from "@nivinjoseph/n-defensive";
import { DateTime } from "./date-time.js";
import { Serializable, serialize } from "@nivinjoseph/n-util";
let DateTimeSpan = (() => {
    let _classDecorators = [serialize("Ndate")];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = Serializable;
    let _instanceExtraInitializers = [];
    let _get_start_decorators;
    let _get_end_decorators;
    var DateTimeSpan = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _get_start_decorators = [serialize];
            _get_end_decorators = [serialize];
            __esDecorate(this, null, _get_start_decorators, { kind: "getter", name: "start", static: false, private: false, access: { has: obj => "start" in obj, get: obj => obj.start }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_end_decorators, { kind: "getter", name: "end", static: false, private: false, access: { has: obj => "end" in obj, get: obj => obj.end }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            DateTimeSpan = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        _start = __runInitializers(this, _instanceExtraInitializers);
        _end;
        get start() { return this._start; }
        get end() { return this._end; }
        get duration() { return this._end.timeDiff(this._start); }
        constructor(data) {
            super(data);
            const { start, end } = data;
            given(start, "start").ensureHasValue().ensureIsType(DateTime);
            this._start = start;
            given(end, "end").ensureHasValue().ensureIsType(DateTime)
                .ensure(t => t.isSameOrAfter(start), "must be same or after start");
            this._end = end;
        }
        /**
        Checks if the given DateTime is within this DateTimeSpan (inclusive of start and end).
    
        Use cases:
    
            this: start ─────────────── end
                        ↑
                        dateTime
    
        Args:
    
            dateTime (DateTime): The DateTime to check.
    
        Returns:
    
            boolean: True if dateTime is within the span [start, end], false otherwise.
        */
        contains(dateTime) {
            given(dateTime, "dateTime").ensureHasValue().ensureIsObject();
            return dateTime.isBetween(this._start, this._end);
        }
        /**
        Checks if this DateTimeSpan completely encompasses another DateTimeSpan.
    
        Use cases:
    
            this: start ─────────────────────── end
            other:      start ─── end
    
        Returns:
    
            boolean: True if this span completely contains the other span.
        */
        encompasses(other) {
            return this._start.isSameOrBefore(other._start) && this._end.isSameOrAfter(other._end);
        }
        /**
        Checks if two DateTimeSpans have any intersection or overlap.
    
        Use cases:
    
            This encompasses other:
            this: start ─────────────────────── end
            other:      start ─── end
    
            Other encompasses this:
            this:       start ─── end
            other: start ─────────────────────── end
    
            Partial overlap - this starts in other:
            this:           start ─────── end
            other: start ─────── end
    
            Partial overlap - this ends in other:
            this:  start ─────── end
            other:       start ─────── end
    
        Returns:
    
            boolean: True if spans overlap or intersect, false if completely separate.
        */
        infringes(other) {
            // if start and end of self is contained in other
            // or other encompasses self
            // or self encompasses other
            if (this.encompasses(other) || other.encompasses(this))
                return true;
            return other.contains(this._start) || other.contains(this._end);
        }
        equals(other) {
            given(other, "other").ensureIsType(DateTimeSpan);
            if (other == null)
                return false;
            if (other === this)
                return true;
            return this._start.equals(other._start) && this._end.equals(other._end);
        }
    };
    return DateTimeSpan = _classThis;
})();
export { DateTimeSpan };
//# sourceMappingURL=date-time-span.js.map