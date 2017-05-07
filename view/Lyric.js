import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

class Lyric extends React.Component{
    constructor(props){
        super(props);
    }

    LyricChars(chars){
        // console.log(chars);
        return chars.map((c, index) => Elem('div', {className:"lyricChar", key:index}, c));
    }

    render() {
        return Elem('span', {className:"lyricSlot"}, this.LyricChars(this.props.lyric));
    }

}

export {Lyric};
