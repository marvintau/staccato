import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Slot} from "./Slot.js";

class Beat extends React.Component{
    constructor(props){
        super(props);
    }

    SlotElems(){
        return this.props.slots.map((slot, index)=>Elem(Slot, {slot:slot, key : index, ref : "slot-" + index}));
    }

    render() {
        // console.log(this.props.slots);
        return Elem('div', {className: "beat"}, this.SlotElems());
    }

    componentDidMount(){
    }

}

export {Beat};
