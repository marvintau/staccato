import React from 'react';
import ReactDOM from 'react-dom';

const Elem = function(component, param, children){
    return React.createElement(component, param, children)
}

const SectionElem = function(sectionName, key, children){
    return Elem('div', {
        key : key,
        ref : sectionName,
        id : sectionName,
        className : sectionName
    }, children)
}

const Draw = function(component, param, children, to){
    ReactDOM.render( Elem(component, param, children), document.getElementById(to))
}

export {Elem, SectionElem, Draw};