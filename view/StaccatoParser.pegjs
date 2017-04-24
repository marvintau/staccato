
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
        verse : lyric.map(l => l[0].join(""))
    };
}
/ "verse" _ verseNumber:[0-9]+ _ part:[a-zA-Z]+ _ '{' _ lyric:([^ \t\n\r\}]+ _)* '}' _ {
    return {
        name : "verse",
        part : part.join(""),
        verse : lyric.map(l => l[0].join(""))
    };
}
/ "parts" _ '{' _ parts:([a-zA-Z]+ _)* '}' _ {
    return {
        name : "parts",
        parts : parts.map(elem => elem[0].join(""))
    };
}
/ section:[a-zA-Z]+ _ '{' content:[^\}]* '}' _ {
    return {
        name : section.join(""),
        content : content.join("")
    }
}

Measure "measure"
= notes:Notes _ bar:MeasureBar _ {

    return {
        beats : notes,
        measureType : bar
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
    let processed = notes.map(note => note[0]).slice(0, 4);
    processed.forEach(note => note.duration = 1/notes.length);

    if(processed.length == 3) {
        processed[0].tripledConn = "open";
        processed[2].tripledConn = "closed";
    }

    console.log(processed);

    return {
        notes:processed,
        underbar : 1
    }
}

DottedNote "dotted"
= "." first:FixedNote _ next:FixedNote {

    first.dotted = true;

    next.underbar = 1;

    return {
        notes : [first, next],
        factor : 1,
        underbar : 0
    }
}

FixedNote "fixed"
= "/" note:ModifiedPitch _ {
    note.duration = 1;
    note.upperConn = "open";
    note.underbar = 0;
    return note;
}

/ note:ModifiedPitch "\\" _ {
    note.duration = 1;
    note.upperConn = "close";
    note.underbar = 0
    return note;
}
/ note:ModifiedPitch _ {
    note.duration = 1;
    note.underbar = 0
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
    return {measureType : "fin"}
}
/ "\:|" _ {
    return {measureType : "rep_fin"}
}
/ "|\:" _ {
    return {measureType : "rep_start"}
}
/ "|" _ {
    return {measureType : "normal"}
}


_ "whitespace"
= [ \t\n\r]*
