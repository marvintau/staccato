
{
    let noteCounter = 0;
    let tieOpen = null;
}

Sections "all sections"
= _ sections:Section* {
    return sections
}

Section "section that contains different info"
=  "chorus" _ part:[a-zA-Z]+ _ "{" measures:Measure* "}" _ {
    return {
        name : "chorus",
        part : part.join(""),
        content : measures
    };
}
/ "verse" _ verseNumber:[0-9]+ _ '{' _ lyric:([^ \t\n\r\}]+ _)* '}' _ {
    return {
        name : "verse",
        part : "unison",
        verses : lyric.map(l => l[0].join(""))
    };
}
/ "verse" _ verseNumber:[0-9]+ _ part:[a-zA-Z]+ _ '{' _ lyric:([^ \t\n\r\}]+ _)* '}' _ {
    return {
        name : "verse",
        part : part.join(""),
        verses : lyric.map(l => l[0].join(""))
    };
}
/ "parts" _ '{' _ parts:([a-zA-Z]+ _)* '}' _ {
    return {
        name : "parts",
        parts : parts.map(elem => elem[0].join(""))
    };
}
/ "phony" _ '{' _ content:[a-zA-Z]+ _ '}' _ {
    console.log(content);
    return {
        name : "phony",
        phony : content.join("")
    };
}
/ section:[a-zA-Z]+ _ '{' _ content:[^\}]* '}' _ {
    return {
        name : section.join(""),
        content : content.join("")
    }
}

Measure "measure"
= notes:Notes _ bar:MeasureBar _ {

    return {
        beats : notes,
        type : bar.type
    }
}

Notes "notes"
= _ first:Note rest:(_ Note)* _{

    var all = [first];

    for(let i = 0; i < rest.length; i ++){
        all.push(rest[i][1]);
    }

    return all;
}

Note "note"
= note:FixedNote _ {
    return note;
}
/ halfed:HalfedNote {
    return halfed;
}
/ dotted:DottedNote {
    return dotted;
}

HalfedNote "duration"
="(" _ notes:(Note _)+ ")" {

    // 去掉空格，并确保不超过三个
    let p = notes.map(note => note[0]);
    p.forEach(note => note.duration = 1/notes.length);

    let startIndex = p[0].underbar ? p[0].underbar.start : p[0].index;
    let endIndex = p[p.length - 1].underbar ? p[p.length - 1].underbar.end : p[p.length-1].index;

    let upperTuplet;
    if(p.length > 2){
        upperTuplet = {start:startIndex, end:endIndex};
    }

    return {
        notes: p,
        underbar : {start:startIndex, end:endIndex}
    }
}

DottedNote "dotted"
= "." first:FixedNote _ next:FixedNote {

    first.dotted = true;

    next.underbar = {start:next.index, end:next.index};

    return {
        notes : [first, next],
        factor : 1,
    }
}

FixedNote "fixed"
= "/" note:ModifiedPitch _ {

    note.duration = 1;
    note.index = noteCounter++;
    
    tieOpen = note.index;

    return note;
}

/ note:ModifiedPitch "\\" _ {
    note.duration = 1;
    note.index = noteCounter++;

    if(tieOpen){
        note.tie = {start: tieOpen, end:note.index}
    }

    return note;
}
/ note:ModifiedPitch _ {
    note.duration = 1;
    note.index = noteCounter++;
    return note
}


ModifiedPitch "modified_pitch"
= acc:Accidental pitch:Pitch octave:Octave {
    pitch.accidental = acc;
    pitch.octave = octave;
    return pitch;
}
/ acc:Accidental pitch:Pitch {
    pitch.accidental = acc;
    return pitch;
}

/ pitch:Pitch octave:Octave {
    pitch.octave = octave;
    return pitch
}
/ pitch:Pitch {
    return pitch
}

Octave "octave"
= [,'][1-3] {

    return (text()[0] == ',') ? - parseInt(text()[1]) : parseInt(text()[1])

}

Accidental "accidental"
= [b#n] {
    return text();
}

Pitch "pitch"
= [0-7] {
    return {pitch : parseInt(text())};
}
/ "-" {
    return {pitch : "–"}
}
/ pitch:[a-zA-Z89]+ {
    console.log('invalid pitch found: ' + pitch);
    return {pitch : "X"}
}

MeasureBar "measure bar"
= "||" _ {
    return {type : "fin"}
}
/ "\:|" _ {
    return {type : "rep_fin"}
}
/ "|\:" _ {
    return {type : "rep_start"}
}
/ "|" _ {
    return {type : "normal"}
}


_ "whitespace"
= [ \t\n\r]*
