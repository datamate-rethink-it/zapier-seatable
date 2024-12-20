// metadata taken from cloud.seatable.io for test tables base 2020-014-19
module.exports = {
  /** @type DTableMetadataTables */
  "metadata": {
    "tables": [
      {
        "_id": "0000",
        "name": "Table1",
        "columns": [
          {
            "key": "0000",
            "name": "Name",
            "type": "text",
            "width": 230,
            "editable": true,
            "resizable": true,
          },
          {
            "key": "wNWg",
            "type": "image",
            "name": "Picture",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "b9X2",
            "type": "single-select",
            "name": "OneOfSet",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "options": [
                {
                  "name": "ok",
                  "color": "#FFDDE5",
                  "textColor": "#202428",
                  "id": "917225",
                },
                {
                  "name": "falsch",
                  "color": "#59CB74",
                  "textColor": "#FFFFFF",
                  "id": "287041",
                },
                {
                  "id": "92892",
                  "name": "undefined",
                  "color": "#ADDF84",
                  "textColor": "#FFFFFF",
                },
                {
                  "name": "Super Special",
                  "color": "#4ECCCB",
                  "textColor": "#FFFFFF",
                  "id": "164576",
                },
              ],
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "486c",
            "type": "link",
            "name": "LinkSelf",
            "editable": true,
            "width": 320,
            "resizable": true,
            "draggable": true,
            "data": {
              "display_column_key": "0000",
              "table_id": "0000",
              "other_table_id": "P8z8",
              "is_internal_link": true,
              "link_id": "pTbM",
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "N4yt",
            "type": "formula",
            "name": "UppercaseName",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "formula": "upper({Name})",
              "operated_columns": [
                "0000",
              ],
              "result_type": "string",
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "L5UU",
            "type": "number",
            "name": "Number",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "format": "number",
              "precision": 0,
              "enable_precision": true,
              "decimal": "dot",
              "thousands": "no",
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "_mtime",
            "type": "mtime",
            "name": "mtime",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
        ],
        "views": [
          {
            "_id": "0000",
            "name": "Default View",
            "type": "table",
            "is_locked": false,
            "rows": [],
            "formula_rows": {
              "F1ZnAP8QQ0aACGZ8Pb0XZQ": {
                "N4yt": "TÖMLI",
              },
              "O5VwAAXJQ0WAIZ7tqI2GTA": {
                "N4yt": "XDXDG",
              },
              "G1aL8HwfTSezyaVgDaC3KQ": {
                "N4yt": "GFCGFJ",
              },
              "N4KfBbnnQaedTdlNOpt-WA": {
                "N4yt": "THIS IS ACTUALLY NOT A NEW RECORD",
              },
              "L65AopRCQAizuiSHDV-v4Q": {
                "N4yt": "ALSO MY THIRD RECORD IS GONE, TOO",
              },
              "CXNyteltQjefnn6FCph4Gw": {
                "N4yt": "TÖMLI",
              },
              "KR1eqcvrSLCR-gvfUoOlrA": {
                "N4yt": "",
              },
              "Gij-3uryRHKQve0L_kyNCQ": {
                "N4yt": "LE-TABLE-ROW",
              },
              "YQI9gu66SkiMX1BlpgiiWg": {
                "N4yt": "UNDEFINED",
              },
              "YJmg38IZS56BCNwYecOaFw": {
                "N4yt": "UNDEFINED",
              },
              "NE8XBaacSbGhi8pRpR0iKw": {
                "N4yt": "UNDEFINED",
              },
              "YjddQDycT6-RqL9uQRjMWA": {
                "N4yt": "",
              },
              "G-UZSo_cRia-sGqwNeQk8g": {
                "N4yt": "UNDEFINED",
              },
              "Qlm8XpsmRnSJFPmQ59mh0A": {
                "N4yt": "UNDEFINED",
              },
              "aJMEA9toQ2itBnphYAhDtA": {
                "N4yt": "",
              },
              "Az4ZoaK6Tk-L93odhp70nw": {
                "N4yt": "UNDEFINED",
              },
              "SQ0z_0FCR6q3FPOHfpVBPA": {
                "N4yt": "HERR ROSSI",
              },
              "c6kNSlOATPWmbSrz7EcLvA": {
                "N4yt": "HERR ROSSI",
              },
              "ZNAiEKohQTarEy5r1kviuw": {
                "N4yt": "HERR ROSSI",
              },
              "FgplEiTiTpS9oypHGSQvaA": {
                "N4yt": "MARTA MARTIAL",
              },
              "bCL9PFJORVmW7fdCHkPkRA": {
                "N4yt": "HERR ROSSI",
              },
              "JRyP_65qQt6Jmsn4IYav2g": {
                "N4yt": "HERR ROSSI",
              },
              "QaSFcaegSRqHMFJOKwQI4Q": {
                "N4yt": "HERR ROSSI",
              },
              "GrmUt2SNSru8NP0X6W4EhQ": {
                "N4yt": "HERR ROSSI",
              },
              "GQUfOlDeTtqt2Y3VawuP3Q": {
                "N4yt": "HERR ROSSI",
              },
              "fz5zhCjYSH-3ITbGFo8Gtw": {
                "N4yt": "HERR ROSSI",
              },
              "RLKRAJpQQ_6c7FYL0tZDbA": {
                "N4yt": "HERR ROSSI",
              },
              "cidfVHMMTYmnFZ3ehP4Ehw": {
                "N4yt": "HERR ROSSI",
              },
              "GWFElNafReWGzac50raAvg": {
                "N4yt": "HERR ROSSI",
              },
              "FchkZawPRje8uxwb2-YhLA": {
                "N4yt": "HERR ROSSI",
              },
              "UtgJwS9zQxehNHsn9OIzHA": {
                "N4yt": "HERR ROSSI",
              },
              "bdESMjANTUKS36_jCA3qDg": {
                "N4yt": "HERR ROSSI",
              },
              "VApNLtjSRB6c4h7vZvzA3A": {
                "N4yt": "HERR ROSSI",
              },
              "LMDUAho3TPGWF3sALfPr1A": {
                "N4yt": "HERR ROSSI",
              },
              "JgqjIDtFRK2akNCN1ugBGA": {
                "N4yt": "HERR ROSSI",
              },
              "O48Pj4t4TlSvH4Jfg1FmHw": {
                "N4yt": "HERR ROSSI",
              },
              "A7fLbuClTLWyv0L--pm5lA": {
                "N4yt": "HERR ROSSI",
              },
              "StZt3XKsQdiWyQlmay4xlQ": {
                "N4yt": "HERR ROSSI",
              },
              "Mwa61mN3TTyNcYfJNyJR-w": {
                "N4yt": "HERR ROSSI",
              },
              "Vi-BR_xURgKI28FgL73sfQ": {
                "N4yt": "HERR ROSSI",
              },
              "IbLo8mW3SXi6XNFHfgc8aA": {
                "N4yt": "HERR ROSSI",
              },
              "f0yNFWxXSTWX2TYUCKr6MQ": {
                "N4yt": "HERR ROSSI",
              },
              "YnMROw3jR3K9nzEL4ph0nQ": {
                "N4yt": "HERR ROSSI",
              },
              "GKBlphWWTuCa4MhADlK7wA": {
                "N4yt": "HERR ROSSI",
              },
              "E8r__TgmSriJ__MdGdb_bQ": {
                "N4yt": "HERR ROSSI",
              },
              "CZ4fzR3MSU27ZFiZEcu0-A": {
                "N4yt": "HERR ROSSI",
              },
              "ekR050IRRbOx6a2LzSWFfw": {
                "N4yt": "HERR ROSSI",
              },
              "ai3hDjkzSeq-3FIVSsOt_Q": {
                "N4yt": "HERR ROSSI",
              },
              "CkKKPcZ0Q720b0L_pH_OPA": {
                "N4yt": "HERR ROSSI",
              },
              "SkGXGXHTSgq2QsNJOzCpOQ": {
                "N4yt": "HERR ROSSI",
              },
              "QLbmOyY2ReeWIWaLMrWo0g": {
                "N4yt": "HERR ROSSI",
              },
              "NXyxLOBaRpejIMWylGO4Fg": {
                "N4yt": "HERR ROSSI",
              },
              "Iwm0EbehRaur2aiAhHtjlA": {
                "N4yt": "HERR ROSSI",
              },
              "eXDWLOqXRvCmdcRIh8A3og": {
                "N4yt": "MTIME: 2021-01-04T10:09:37.391+00:00 --- NAME: GFCGFJ",
              },
              "BPrUhmBLQUSsuXsO8Sj57Q": {
                "N4yt": "HERR ROSSI",
              },
              "eAhJ6p_-T5OwpvR1j8j4lA": {
                "N4yt": "HERR ROSSI",
              },
              "J7xRFThhRMm2GtAX3JLAiw": {
                "N4yt": "HERR ROSSI",
              },
              "YhBDfJ_5QTiXXFI-7WZlxg": {
                "N4yt": "HERR ROSSI",
              },
              "OqxDdF2lT4GVHRGBBGLteA": {
                "N4yt": "HERR ROSSI",
              },
              "DLUmBQTITpKVZJedNfM8og": {
                "N4yt": "HERR ROSSI",
              },
              "TOqgsgrATLKzIht1Zk1ZOQ": {
                "N4yt": "HERR ROSSI",
              },
              "LOibcuZnQO6aXvelOblQpg": {
                "N4yt": "HERR ROSSI",
              },
              "cvCgbfueRxC8qdgQvDdAWg": {
                "N4yt": "HERR ROSSI",
              },
              "AQcPLDMaQ0maOJkvQ_SMEw": {
                "N4yt": "HERR ROSSI",
              },
              "C3J_o1D5RwOH5AEEAF00WA": {
                "N4yt": "HERR ROSSI",
              },
              "Y3GxfHrCTtqQUG3wT2RaHQ": {
                "N4yt": "HERR ROSSI",
              },
              "O1Ij1cW5SUan4Z0MQ9cvVg": {
                "N4yt": "HERR ROSSI",
              },
              "cEKELQMOSQCN_NZA3KNGcw": {
                "N4yt": "HERR ROSSI",
              },
              "ALPM-CCXRm6xeOereMO9Ow": {
                "N4yt": "HERR ROSSI",
              },
              "Zv-yDH_5STKpQpebEpAvXA": {
                "N4yt": "HERR ROSSI",
              },
              "fjaEn8cCRdyJNbEhffYwLA": {
                "N4yt": "HERR ROSSI",
              },
              "DeLgaIROQ3CeMUISAJSZSg": {
                "N4yt": "HERR ROSSI",
              },
              "HuJBE65BSW-PfTip0ciaug": {
                "N4yt": "HERR ROSSI",
              },
              "H96bfYaRT3K3UgQl0ovUXg": {
                "N4yt": "HERR ROSSI",
              },
              "XLAn0e8eQkOPTjDyUFFYbA": {
                "N4yt": "HERR ROSSI",
              },
              "YO5z4dkASQqQjOXAXz8Urw": {
                "N4yt": "HERR ROSSI",
              },
              "byqqcl7HTnmNfm4nVLSEWQ": {
                "N4yt": "HERR ROSSI",
              },
              "Sh3RQqRHQg-JFiOVQ5-0JQ": {
                "N4yt": "HERR ROSSI",
              },
              "KpM6tj00QqCAGlgloQqK4w": {
                "N4yt": "HERR ROSSI",
              },
              "YfldQsG2Sdm0byRj4wBzYg": {
                "N4yt": "HERR ROSSI",
              },
              "BKHy-IVeS62YLWVmGy2x5w": {
                "N4yt": "HERR ROSSI",
              },
              "VvMulhcwQkqL6BcqYeJZyw": {
                "N4yt": "HERR ROSSI UND GASTON",
              },
              "C0jcwb66TNCJYlVb4W7-Sg": {
                "N4yt": "HERR ROSSI UND GASTON",
              },
              "Xi7NIsT_Q8WeZDEsr-V8ew": {
                "N4yt": "HERR ROSSI",
              },
              "dMAhyFGeQuej020SWqNZxw": {
                "N4yt": "HERR ROSSI",
              },
              "SkeUpW0lTKGjGGGOLyYi7g": {
                "N4yt": "HERR ROSSI",
              },
              "bKQhxieqTg6gFsFdNOT_3w": {
                "N4yt": "HERR ROSSI",
              },
              "aFGoUTUjQdiXYcYyQ7x7Lg": {
                "N4yt": "HERR ROSSI",
              },
              "TgBQQ91pTDiihhs_DR6-fg": {
                "N4yt": "HERR ROSSI",
              },
              "CAxDrHF7Rb-thhKHYMthyw": {
                "N4yt": "HERR ROSSI",
              },
              "U64KSFeJQDS5gSqO9ccgPA": {
                "N4yt": "HERR ROSSI",
              },
              "JVCh3NfRQ7yi22bhdsvveA": {
                "N4yt": "HERR ROSSI",
              },
              "UjkXB4Q4RK-Zr4VA94Wmrw": {
                "N4yt": "HERR ROSSI",
              },
              "XaDtplYlSk6zIx19Hp0vrQ": {
                "N4yt": "HERR ROSSI",
              },
              "EnBLWZRCQgWZpBhYqMmK3w": {
                "N4yt": "HERR ROSSI",
              },
              "fK1YNTvhTaKUIm3NyszSIg": {
                "N4yt": "HERR ROSSI",
              },
              "QMgRzjYnQF67skDA8ohNTA": {
                "N4yt": "HERR ROSSI",
              },
              "We_2iJ5aQ4i_yGI-QFvttw": {
                "N4yt": "HERR ROSSI",
              },
              "GxPXfNIzS9arhN6CWFkKpA": {
                "N4yt": "HERR ROSSI",
              },
              "GK4WsHbcRIW6k2QEqWCpaQ": {
                "N4yt": "HERR ROSSI",
              },
              "UBAyfhJcQRyC1O4l1VQNrg": {
                "N4yt": "HERR ROSSI",
              },
              "frb_pL9JQX2XiyRNOfFKEg": {
                "N4yt": "HERR ROSSI",
              },
              "XUGejgC5RuahCVYZuFuYOw": {
                "N4yt": "HERR ROSSI",
              },
              "JEgwA3LGQvalXQFxjS5SLg": {
                "N4yt": "HERR ROSSI",
              },
              "HPqaUzWzTiqxSGVpTeNo0Q": {
                "N4yt": "HERR ROSSI",
              },
              "LYR36I_kSpaOKIvWpcRgcA": {
                "N4yt": "HERR ROSSI",
              },
              "e4lV_wA9QGyPbW-g2J9mqw": {
                "N4yt": "HERR ROSSI",
              },
              "Pp0YfjuHSb2MSnrkkFCLZw": {
                "N4yt": "HERR ROSSI",
              },
              "CyzmfDdjRYmt7usFj35_jQ": {
                "N4yt": "HERR ROSSI",
              },
              "LNxJKmn1RhuttSAsPLTSEA": {
                "N4yt": "HERR ROSSI",
              },
              "PCuFzSINRnia_vLYAFRWRg": {
                "N4yt": "MEHR ALS MEERLE",
              },
              "M3H1c7khTPukvI4HnHs6aQ": {
                "N4yt": "NOCH MEHR ALS MEERLE",
              },
              "AKLvT2GnT22ijnEl7FV56w": {
                "N4yt": "NOCH MEHR ALS MEERLE",
              },
              "KFa2_MT6R7WdTSsO9tbhKw": {
                "N4yt": "REAL FAKE",
              },
              "fqCK5dZzQz6FifI2KF83_A": {
                "N4yt": "FAKE",
              },
              "ICFgStSLQeqzgIoeLcI1zA": {
                "N4yt": "NOCH MEHR ALS MEERLE",
              },
              "VhRmybLeTiyNbmctfaxonw": {
                "N4yt": "HERR ROSSI",
              },
              "Zx32OGwcTCS6eLeqbun1XA": {
                "N4yt": "HERR ROSSI",
              },
              "Z21ubPORQz2ttudMKGFOVA": {
                "N4yt": "HERR ROSSI",
              },
              "cysabYFbTtGpOX2MOZjs1g": {
                "N4yt": "HERR ROSSI",
              },
              "FR04dMwfStGZyD8C6HUHwA": {
                "N4yt": "HERR ROSSI",
              },
              "AKBB18w9TXmL9q_nY5oaCA": {
                "N4yt": "HERR ROSSI",
              },
              "GJ9qLyaTSWeHzSK71V07Bg": {
                "N4yt": "HERR ROSSI",
              },
              "bzZ-mueTR8GTQ0-6r8kK4Q": {
                "N4yt": "HERR ROSSI",
              },
              "YMXi2RYDTNihU11FJAT5ig": {
                "N4yt": "HERR ROSSI",
              },
              "CUES2t29RgOdNSNkpsF5vA": {
                "N4yt": "HERR ROSSI",
              },
              "IIc6j1Q8TwCtcfwQsorwwg": {
                "N4yt": "HERR ROSSI",
              },
              "drzVKsJpQ8K0KRR69w0gPA": {
                "N4yt": "HERR NICHT SO GUT",
              },
              "Nf6pKZfvQGGGZAg7xRz1rA": {
                "N4yt": "HERR WU",
              },
              "Mr-fwplmTx2sm2SJ5E85sQ": {
                "N4yt": "HERR WU",
              },
              "ErRu0oolS_abn4wI22ODfw": {
                "N4yt": "HERR WU",
              },
              "IyY27kR1S2GkOZi31iVh8w": {
                "N4yt": "",
              },
              "IXTTIkGzTu6x84YClTrjgA": {
                "N4yt": "",
              },
              "NtvqbK9URJOWVrg2g2_-lA": {
                "N4yt": "",
              },
              "YOIR09fFRhmIHKoJxgs9gQ": {
                "N4yt": "",
              },
              "RlzHpV0hRcGorimBLuVeiw": {
                "N4yt": "",
              },
              "anHWRQS7R42MHSVk-Cy40Q": {
                "N4yt": "",
              },
              "YD73OTOhSN2BT0PvWJV3qQ": {
                "N4yt": "",
              },
              "Pwh1I2-WRripImjObMZF-A": {
                "N4yt": "",
              },
              "JTvdtsG4SEmAhF8RUwxTig": {
                "N4yt": "HERR KLINGENBERG",
              },
              "IF__cb23TUmraIK2Ik4Z8w": {
                "N4yt": "HERR ROSSI",
              },
              "SQ3PfYawQOW_7HM-TJnMjA": {
                "N4yt": "HERR ROSSI",
              },
              "Spz9AnjlRtanSXYkR-N5KA": {
                "N4yt": "HERR ROSSI",
              },
              "WR_SZS60SVuQf2P0gRl8pg": {
                "N4yt": "HERR ROSSI",
              },
              "dn9G9vWMQTWSmzSMkYRIAw": {
                "N4yt": "",
              },
              "FK3ttO_0QZuc8LSWliYcLg": {
                "N4yt": "HERR ROSSI",
              },
              "ZsNdWr1YSUSzhh8hVuw1AQ": {
                "N4yt": "HERR ROSSI",
              },
              "XIdnxuAJRLeTKnIwNKQP6g": {
                "N4yt": "NEW NAME IN TABLE 1",
              },
              "ObKihQQWQtiHC9XTbGFZNQ": {
                "N4yt": "HERR ROSSI",
              },
              "Vv-rKqHrRaml6dg9XSJPgQ": {
                "N4yt": "HERR ROSSI",
              },
              "TfWE69KuQbe7m32ghU-JoQ": {
                "N4yt": "HERR ROSSI",
              },
              "V_Z7Nz7tQbme9TTFST31Rw": {
                "N4yt": "HERR ROSSI",
              },
              "XS9pN9PWTqG0H_Q_Y3euoA": {
                "N4yt": "HERR ROSSI",
              },
              "KPEB16YbRC6GFET1CYQ_Zg": {
                "N4yt": "HERR ROSSI",
              },
              "XpzLRcuiS7yVURkTPc4WfA": {
                "N4yt": "HERR ROSSI",
              },
              "FETwVMEgTN-QQpjRj82OEw": {
                "N4yt": "HERR ROSSI",
              },
              "c2uZJbhBSD-zeixLTLuzkA": {
                "N4yt": "HERR ROSSI",
              },
              "Onn3rShHRIuoJbFY_sHvqw": {
                "N4yt": "HERR ROSSI",
              },
              "Ox_WW89EQSmywSg0Fbj9EQ": {
                "N4yt": "HERR ROSSI",
              },
              "KvuBSXUsTb60KMDtijwRmA": {
                "N4yt": "HERR ROSSI",
              },
              "CkZXuRXnT4-kwwy5d7aY1Q": {
                "N4yt": "HERR ROSSI",
              },
              "GYd_DtCZTCi6bxSNUB6AAA": {
                "N4yt": "HERR ROSSI",
              },
              "HFVSIgSsR3ycpemDQ6IHXg": {
                "N4yt": "HERR ROSSI",
              },
              "W83lTxjrQH2h7Y3rYfflxA": {
                "N4yt": "HERR ROSSI",
              },
              "eSHkpotOTIiuMjCHWf53_A": {
                "N4yt": "HERR ROSSI",
              },
              "V8noL9ArQJuVyshr7Gl1YA": {
                "N4yt": "HERR ROSSI",
              },
              "H7qqV5D5RUaAWsTdXwjHuQ": {
                "N4yt": "HERR ROSSI",
              },
              "fr4zaPDDRoKBXuO_ANbyPQ": {
                "N4yt": "HERR ROSSI",
              },
              "K8gX9qYcTbWTVkPfLn8XiA": {
                "N4yt": "HERR ROSSI",
              },
              "dAkeccSBQLijtpqlaCDcJg": {
                "N4yt": "HERR ROSSI",
              },
              "G_vRxErPTZ-hNDTj_NywSQ": {
                "N4yt": "HERR ROSSI",
              },
              "DyMLQ524RlK5pgPyGQDM6g": {
                "N4yt": "HERR ROSSI",
              },
              "Ff3ELRGQQmicEs3Vj-W_XA": {
                "N4yt": "HERR ROSSI",
              },
              "MbIes2g0S6yObRZRaH_CEw": {
                "N4yt": "HERR ROSSI",
              },
              "cd_IBuRsSoiBK2oYE5herQ": {
                "N4yt": "HERR ROSSI",
              },
              "aIo6e8jHSwy9r1NxXHA9dg": {
                "N4yt": "HERR ROSSI",
              },
              "KYR-NGcZTJaagH5q372rDQ": {
                "N4yt": "HERR ROSSI",
              },
              "de6ntJAeQlyQA823hM9QIA": {
                "N4yt": "HERR ROSSI",
              },
              "WRQRruRKQw6Exi9QgZcgcA": {
                "N4yt": "HERR ROSSI",
              },
              "Fi0LQY9XSI6073vGJCRU1g": {
                "N4yt": "HERR ROSSI",
              },
              "BhCgSX8aSNWPq-78t1brhg": {
                "N4yt": "HERR ROSSI",
              },
              "BT39dTTEQdOAvRdLrd0u7Q": {
                "N4yt": "HERR ROSSI",
              },
              "BhW6S3jbRGqTrb3cBzyQgg": {
                "N4yt": "HERR ROSSI",
              },
              "fe9_aEiCTZOVdVs8VS-v0g": {
                "N4yt": "HERR ROSSI",
              },
              "SDAd5MZ1Q2ia0eDR95nOSw": {
                "N4yt": "HERR ROSSI",
              },
              "WgH2dPFFTkW99Dj2mpXk-A": {
                "N4yt": "HERR ROSSI",
              },
              "XAZIxIqNRjyPuZITlEpuMw": {
                "N4yt": "HERR ROSSI",
              },
              "Ybyogz2lTuKKgwMmJekOEQ": {
                "N4yt": "HERR ROSSI",
              },
              "V3Js7ld6RJWkR3uC0JALPg": {
                "N4yt": "HERR ROSSI",
              },
              "Ei23_aLlRCiZAyEcgXtv4g": {
                "N4yt": "HERR ROSSI",
              },
              "GMmvEh9kQDachsO8U8UqIw": {
                "N4yt": "HERR ROSSI",
              },
              "MOnmu0JQRfiPgHxqEjFVzg": {
                "N4yt": "HERR ROSSI",
              },
              "HVO2W2XnTHqfaQhiRDbJxw": {
                "N4yt": "SIMSE",
              },
              "EddYW-llRZujF3dXx-onhA": {
                "N4yt": "HERR ROSSI",
              },
              "P7jVtyXZQ6megU4lK9QiCg": {
                "N4yt": "HERR ROSSI",
              },
              "awK8FVwtT4CSJeATiWZCbw": {
                "N4yt": "HERR ROSSI",
              },
              "QuTSfaKEQbaxxsi21hO-Sw": {
                "N4yt": "HERR ROSSI",
              },
              "EPFyS13pRI-xSper_yLzzA": {
                "N4yt": "HERR ROSSI",
              },
              "EL7be50YRLqF0Bp2tv455A": {
                "N4yt": "NEUER TEST EINTRAG 1.1.3",
              },
              "cODCCZdaSSeIvRoNscMNZA": {
                "N4yt": "NEUER TEST EINTRAG 1.1.3 - 2",
              },
              "ePw5vuluSFePKhtx_x25dA": {
                "N4yt": "HERR ROSSI",
              },
              "Grh86zATRO6guuhtgmrZMA": {
                "N4yt": "HERR ROSSI",
              },
              "O4CmRNz7TLKYWuLunFarZw": {
                "N4yt": "HERR ROSSI",
              },
              "aFYa_FEDQF-sGHMDlt8raw": {
                "N4yt": "NEUER TEST EINTRAG 1.1.3 - 3",
              },
              "At41NF4-TXi3uH0o7Xfrow": {
                "N4yt": "NEUER TEST EINTRAG 1.1.3 - 4",
              },
              "D-x5dWDqTRmJMM0oZJbTEg": {
                "N4yt": "NEUER TEST EINTRAG 1.1.4 - 1",
              },
              "Gj2GFwLZRlyT3g_2dguX4w": {
                "N4yt": "HERR ROSSI",
              },
              "LyUU0HN6RUa8G82RjLVlxg": {
                "N4yt": "",
              },
              "FW1eFRX2QJuP69s9tCQ_zQ": {
                "N4yt": "HERR ROSSI",
              },
              "a1sRVwQHTJW7JnEcA4p4-g": {
                "N4yt": "HERR ROSSI",
              },
              "ZYWrzKv4Qx6SsOxFcXLp8A": {
                "N4yt": "HERR ROSSI",
              },
              "UO9tnms3ToCREYF2T8ClZw": {
                "N4yt": "HERR ROSSI",
              },
              "TCYan6FoQCOyLCYxtfSstg": {
                "N4yt": "HERR ROSSI",
              },
            },
            "summaries": [],
            "filter_conjunction": "And",
            "filters": [],
            "sorts": [],
            "hidden_columns": [],
            "groupbys": [],
            "groups": [],
          },
          {
            "_id": "sx3j",
            "name": "Custom View",
            "type": "table",
            "is_locked": false,
            "filter_conjunction": "And",
            "filters": [
              {
                "column_key": "b9X2",
                "filter_predicate": "is",
                "filter_term": "917225",
              },
              {
                "column_key": "0000",
                "filter_predicate": "contains",
                "filter_term": "le",
              },
              {
                "column_key": "L5UU",
                "filter_predicate": "not_equal",
                "filter_term": "-565968456134653",
              },
            ],
            "sorts": [],
            "groupbys": [],
            "group_rows": [],
            "groups": [],
            "colorbys": {},
            "hidden_columns": [],
            "rows": [],
            "formula_rows": {
              "Gij-3uryRHKQve0L_kyNCQ": {
                "N4yt": "LE-TABLE-ROW",
              },
              "PCuFzSINRnia_vLYAFRWRg": {
                "N4yt": "MEHR ALS MEERLE",
              },
              "M3H1c7khTPukvI4HnHs6aQ": {
                "N4yt": "NOCH MEHR ALS MEERLE",
              },
              "AKLvT2GnT22ijnEl7FV56w": {
                "N4yt": "NOCH MEHR ALS MEERLE",
              },
            },
            "link_rows": {},
            "summaries": {},
            "colors": {},
          },
        ],
      },
      {
        "_id": "P8z8",
        "name": "Table2 - Target",
        "is_header_locked": false,
        "columns": [
          {
            "key": "0000",
            "type": "text",
            "name": "Name",
            "editable": true,
            "width": 602,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
            "editor": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
            "formatter": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
          },
          {
            "key": "SRx7",
            "type": "number",
            "name": "Hours",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "format": "number",
              "precision": 0,
              "enable_precision": true,
              "decimal": "dot",
              "thousands": "no",
            },
            "permission_type": "",
            "permitted_users": [],
            "editor": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
            "formatter": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
          },
          {
            "key": "5fV6",
            "type": "long-text",
            "name": "LongTextColumn",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
            "editor": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
            "formatter": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
          },
          {
            "key": "tp0C",
            "type": "link",
            "name": "LinkToTable1",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "display_column_key": "0000",
              "table_id": "0000",
              "other_table_id": "P8z8",
              "is_internal_link": true,
              "link_id": "pTbM",
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "V9xC",
            "type": "checkbox",
            "name": "Check",
            "editable": true,
            "width": 117,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "2SRr",
            "type": "multiple-select",
            "name": "Multi",
            "editable": true,
            "width": 109,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "tqfF",
            "type": "url",
            "name": "Url",
            "editable": true,
            "width": 77,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "0I0g",
            "type": "duration",
            "name": "Duration",
            "editable": true,
            "width": 116,
            "resizable": true,
            "draggable": true,
            "data": {
              "format": "duration",
              "duration_format": "h:mm",
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "C9vf",
            "type": "date",
            "name": "Date",
            "editable": true,
            "width": 98,
            "resizable": true,
            "draggable": true,
            "data": {
              "format": "YYYY-MM-DD",
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "7rOA",
            "type": "file",
            "name": "File",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "w5n6",
            "type": "collaborator",
            "name": "Collaborator",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "enable_send_notification": true,
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "q2Y8",
            "type": "email",
            "name": "Email",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "_creator",
            "type": "creator",
            "name": "Creator",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "_last_modifier",
            "type": "last-modifier",
            "name": "Modifier",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "n01g",
            "type": "auto-number",
            "name": "ExNum",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "format": "Ex-00000000",
              "max_used_auto_number": 32,
              "digits": 8,
              "prefix_type": "string",
              "prefix": "Ex",
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "0904",
            "type": "link",
            "name": "SelfLink",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "display_column_key": "0000",
              "table_id": "P8z8",
              "other_table_id": "P8z8",
              "is_internal_link": true,
              "link_id": "1Rz0",
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "_ctime",
            "type": "ctime",
            "name": "Ctime",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "_mtime",
            "type": "mtime",
            "name": "Mtime",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
        ],
        "views": [
          {
            "_id": "0000",
            "name": "Default View",
            "type": "table",
            "is_locked": false,
            "filter_conjunction": "And",
            "filters": [],
            "sorts": [],
            "groupbys": [],
            "group_rows": [],
            "groups": [],
            "colorbys": {},
            "hidden_columns": [],
            "rows": [],
            "formula_rows": {},
            "link_rows": {},
            "summaries": {},
            "colors": {},
          },
        ],
      },
      {
        "_id": "JqMk",
        "name": "Event Table",
        "is_header_locked": false,
        "columns": [
          {
            "key": "0000",
            "type": "auto-number",
            "name": "Event",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "format": "0000",
              "max_used_auto_number": 18,
              "digits": 4,
              "prefix_type": null,
              "prefix": null,
            },
            "permission_type": "",
            "permitted_users": [],
            "editor": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
            "formatter": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
          },
          {
            "key": "pQt2",
            "type": "text",
            "name": "Name",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "fcS0",
            "type": "text",
            "name": "Value",
            "editable": true,
            "width": 700,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "_ctime",
            "type": "ctime",
            "name": "Created",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
        ],
        "views": [
          {
            "_id": "0000",
            "name": "Default View",
            "type": "table",
            "is_locked": false,
            "filter_conjunction": "And",
            "filters": [],
            "sorts": [],
            "groupbys": [],
            "group_rows": [],
            "groups": [],
            "colorbys": {},
            "hidden_columns": [],
            "rows": [],
            "formula_rows": {},
            "link_rows": {},
            "summaries": {},
            "colors": {},
          },
        ],
      },
      {
        "_id": "UDSZ",
        "name": "Table3 - Map",
        "is_header_locked": false,
        "columns": [
          {
            "key": "0000",
            "type": "text",
            "name": "Name",
            "editable": true,
            "width": 543,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "B62P",
            "type": "text",
            "name": "Adresse",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
        ],
        "views": [
          {
            "_id": "0000",
            "name": "Default View",
            "type": "table",
            "is_locked": false,
            "filter_conjunction": "And",
            "filters": [],
            "sorts": [],
            "groupbys": [],
            "group_rows": [],
            "groups": [],
            "colorbys": {},
            "hidden_columns": [],
            "rows": [],
            "formula_rows": {},
            "link_rows": {},
            "summaries": {},
            "colors": {},
          },
        ],
      },
      {
        "_id": "XtLV",
        "name": "SeaTable Zapier",
        "is_header_locked": false,
        "columns": [
          {
            "key": "0000",
            "type": "auto-number",
            "name": "Track",
            "editable": true,
            "width": 88,
            "resizable": true,
            "draggable": true,
            "data": {
              "format": "STZ-0000",
              "max_used_auto_number": 10,
              "digits": 4,
              "prefix_type": "string",
              "prefix": "STZ",
            },
            "permission_type": "",
            "permitted_users": [],
            "editor": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
            "formatter": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
          },
          {
            "key": "25wS",
            "type": "text",
            "name": "Position",
            "editable": true,
            "width": 414,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "oMFr",
            "type": "long-text",
            "name": "Notizen",
            "editable": true,
            "width": 520,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
            "editor": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
            "formatter": {
              "key": null,
              "ref": null,
              "props": {},
              "_owner": null,
            },
          },
          {
            "key": "9r4T",
            "type": "multiple-select",
            "name": "Tag",
            "editable": true,
            "width": 239,
            "resizable": true,
            "draggable": true,
            "data": {
              "options": [
                {
                  "name": "Needs-Fixing",
                  "color": "#F4667C",
                  "textColor": "#FFFFFF",
                  "id": "452852",
                },
                {
                  "name": "Maintain",
                  "color": "#DEF7C4",
                  "textColor": "#202428",
                  "id": "467397",
                },
                {
                  "name": "Needs-Review",
                  "color": "#FBD44A",
                  "textColor": "#FFFFFF",
                  "id": "575389",
                },
                {
                  "name": "Before-Release",
                  "color": "#D8FAFF",
                  "textColor": "#202428",
                  "id": "714069",
                },
              ],
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "M5KA",
            "type": "checkbox",
            "name": "Hide",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
        ],
        "views": [
          {
            "_id": "0000",
            "name": "Plan",
            "type": "table",
            "is_locked": false,
            "filter_conjunction": "And",
            "filters": [
              {
                "column_key": "M5KA",
                "filter_predicate": "is",
                "filter_term": false,
              },
            ],
            "sorts": [],
            "groupbys": [
              {
                "column_key": "9r4T",
                "sort_type": "up",
                "count_type": "",
              },
            ],
            "group_rows": [],
            "groups": [],
            "colorbys": {},
            "hidden_columns": [],
            "rows": [],
            "formula_rows": {},
            "link_rows": {},
            "summaries": {},
            "colors": {},
          },
          {
            "_id": "Qxt8",
            "name": "Next Release",
            "type": "table",
            "is_locked": false,
            "filter_conjunction": "And",
            "filters": [
              {
                "column_key": "M5KA",
                "filter_predicate": "is",
                "filter_term": false,
              },
              {
                "column_key": "9r4T",
                "filter_predicate": "has_any_of",
                "filter_term": [
                  "714069",
                  "452852",
                  "575389",
                ],
              },
            ],
            "sorts": [],
            "groupbys": [
              {
                "column_key": "9r4T",
                "sort_type": "up",
                "count_type": "",
              },
            ],
            "group_rows": [],
            "groups": [],
            "colorbys": {},
            "hidden_columns": [],
            "rows": [],
            "formula_rows": {},
            "link_rows": {},
            "summaries": {},
            "colors": {},
          },
          {
            "_id": "JBFq",
            "name": "Review",
            "type": "table",
            "is_locked": false,
            "filter_conjunction": "And",
            "filters": [],
            "sorts": [],
            "groupbys": [],
            "group_rows": [],
            "groups": [],
            "colorbys": {},
            "hidden_columns": [],
            "rows": [],
            "formula_rows": {},
            "link_rows": {},
            "summaries": {},
            "colors": {},
          },
        ],
      },
      {
        "_id": "ADSg",
        "name": "Link Table",
        "is_header_locked": false,
        "columns": [
          {
            "key": "0000",
            "type": "text",
            "name": "Name",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "st1X",
            "type": "text",
            "name": "Comment",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": null,
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "WJVX",
            "type": "number",
            "name": "Rating",
            "editable": true,
            "width": 111,
            "resizable": true,
            "draggable": true,
            "data": {
              "format": "number",
              "precision": 2,
              "enable_precision": false,
              "decimal": "dot",
              "thousands": "no",
            },
            "permission_type": "",
            "permitted_users": [],
          },
          {
            "key": "99m0",
            "type": "link",
            "name": "Link",
            "editable": true,
            "width": 200,
            "resizable": true,
            "draggable": true,
            "data": {
              "display_column_key": "0000",
              "table_id": "ADSg",
              "other_table_id": "ADSg",
              "is_internal_link": true,
              "link_id": "OqoB",
            },
            "permission_type": "",
            "permitted_users": [],
          },
        ],
        "views": [
          {
            "_id": "0000",
            "name": "Default View",
            "type": "table",
            "is_locked": false,
            "filter_conjunction": "And",
            "filters": [],
            "sorts": [],
            "groupbys": [],
            "group_rows": [],
            "groups": [],
            "colorbys": {},
            "hidden_columns": [],
            "rows": [],
            "formula_rows": {},
            "link_rows": {},
            "summaries": {},
            "colors": {},
          },
        ],
      },
    ],
  },
};

