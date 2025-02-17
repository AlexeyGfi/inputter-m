class InputterSuffixOrNot extends HTMLElement {
    constructor() {
        super();

        // Создаем Shadow DOM
        const shadow = this.attachShadow({mode: 'open'});

        // Тип поля (либо numeric, либо free)
        this.fieldType = 'numeric';

        // Значение по умолчанию
        this.defaultValue = '0'

        // Переменная-флаг, отвечающий за публикацию ссылки на стили
        this.linkAdded = false;

        // Создаем контейнер
        this.container = document.createElement('div');
        this.container.classList.add('inputter-m');
        this.container.addEventListener('click', () => {
            this.input.focus();
        });

        // Создаем скрытый элемент для измерения ширины
        // ...с его помощью мы будем определять ширину инпута
        this.measureSpan = document.createElement('span');
        this.measureSpan.classList.add('hidden-measurer');
        shadow.appendChild(this.measureSpan);

        // Создаем input
        this.input = document.createElement('input');
        this.input.type = 'text';

        // Выбрасываем фокус наверх
        this.input.addEventListener('focus', () => {
            this.dispatchEvent(new Event('focus'));
        });
        this.container.appendChild(this.input);

        // Добавляем контейнер в Shadow DOM
        shadow.appendChild(this.container);

        // Слушаем фокус извне
        this.addEventListener('focus', () => {
            this.focus();
        });
    }

    // Приводим к числовому виду
    postfix() {
        if (this.fieldType === 'numeric') {
            let clearedValue;

            if (this.input.value !== '') {
                clearedValue = this.input.value.replace(/,/g, '.');
                clearedValue = clearedValue[0] === '-' && this.allowNegative
                    ? '-' + clearedValue.replace(/[^\d.]/g, '')
                    : clearedValue.replace(/[^\d.]/g, '');

                let dotttedTest = clearedValue;
                let matchedDotted = [...dotttedTest.matchAll(/\./g)];
                if (matchedDotted.length > 1) {
                    matchedDotted.shift();
                    for(let mL = matchedDotted.length, i = mL - 1; i >= 0; i--) {
                        dotttedTest = dotttedTest.slice(0, matchedDotted[i].index) + dotttedTest.slice(matchedDotted[i].index + 1);
                    }

                    clearedValue = dotttedTest;
                }

                // 0017 => 17; 05,6 => 5.6
                // !!! 0.25 - валидное число
                if (clearedValue.length > 1) {
                    clearedValue = clearedValue.replace(/^0{1,}(?!\.)/, '');
                }

                // .14 => 0.14
                if (clearedValue[0] === '.') {
                    clearedValue = '0' + clearedValue;
                }

                if (this.input.value !== clearedValue && !isNaN(clearedValue)) {
                    this.input.value = clearedValue;
                }
            }

            if (this.stableValue !== '') {
                clearedValue = String(this.stableValue).replace(/,/g, '.');
                clearedValue = clearedValue[0] === '-' && this.allowNegative ? '-' + clearedValue.replace(/[^\d.]/g, '') : clearedValue.replace(/[^\d.]/g, '');

                let dotttedTest = clearedValue;
                let matchedDotted = [...dotttedTest.matchAll(/\./g)];
                if (matchedDotted.length > 1) {
                    matchedDotted.shift();
                    for(let mL = matchedDotted.length, i = mL - 1; i >= 0; i--) {
                        dotttedTest = dotttedTest.slice(0, matchedDotted[i].index) + dotttedTest.slice(matchedDotted[i].index + 1);
                    }

                    clearedValue = dotttedTest;
                }

                if (clearedValue.length > 1) {
                    clearedValue = clearedValue.replace(/^0{1,}(?!\.)/, '');
                }

                // .14 => 0.14
                if (clearedValue[0] === '.') {
                    clearedValue = '0' + clearedValue;
                }

                if (this.stableValue !== clearedValue) {
                    this.stableValue = clearedValue;
                }
            }
        }
    }

    // Когда извне нас фокусируют, курсор должен попасть в инпут
    focus() {
        this.input.focus();
    }

    static get observedAttributes() {
        return ["data-error-css", "data-suffix"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-error-css') {
            if (newValue) {
                this.container.classList.add('error');
            } else {
                this.container.classList.remove('error');
            }
        }
        if (name === 'data-suffix') {
            this.numSuffix = newValue;
            this.setSuffix();
        }
    }

    /**
     * Наш веб-компонент является комплексным.
     * Суффикс нужен во многих случаях.
     * Чтобы пользователь вводил только число, но видел осмысленное значение.
     *
     * Например:
     * 4500 м2
     * 16000 шт
     * 1000 евро
     * ... где м2, шт, евро -- суффиксы
     *
     * Суффиксы передаём веб-компоненту через дата-атрибут data-suffix
     */
    setSuffix(isMount = false) {
        if (this.numSuffix) {
            if (typeof this.suffix === 'undefined' && !isMount) {
                return;
            }
            if (typeof this.suffix === 'undefined') {
                // Создаем элемент для отображения суффикса
                this.suffix = document.createElement('span');
                if (this.numSuffix === 'м2') {
                    this.suffix.innerHTML = 'м<sup>2</sup>';
                } else if (this.numSuffix === 'р') {
                    this.suffix.innerHTML = '&#8381;';
                } else {
                    this.suffix.innerHTML = this.numSuffix
                }

                if (this.mode === 'approvable') {
                    this.suffix.addEventListener('mouseover', () => {
                        this.approveReady = true;
                    });
                    this.suffix.addEventListener('mouseout', () => {
                        this.approveReady = false;
                    });
                }

                this.container.appendChild(this.suffix);

                this.suffix.addEventListener('click', () => {
                    this.input.select();
                    this.input.focus();
                });
            } else {
                this.suffix.innerHTML = this.numSuffix === 'м2' ? 'м<sup>2</sup>' : this.numSuffix;
            }
        }
    }

    // Когда элемент корректно добавлен в DOM
    connectedCallback() {
        let attrFieldType = this.getAttribute('data-field-type');
        switch(attrFieldType) {
            case 'free' :
                this.fieldType = 'free';
                this.defaultValue = '';
                break;
            default:
                this.fieldType = 'numeric';
                this.defaultValue = '0'
        }

        let attrEmptyValue = this.getAttribute('data-empty-value');
        if (typeof attrEmptyValue !== 'undefined' && attrEmptyValue !== null) {
            this.defaultValue = attrEmptyValue;
        }

        // Добавляем ссылку на стили.
        //
        // Ссылка на стили пробрасываем через дата-атрибут data-css-file
        //
        // Время модификации (чтобы подхватывать изменения в файле стилей)
        // пробрасываем через дата-атрибут data-css-file-mtime
        if (!this.linkAdded) {
            let cssFileMTime = this.getAttribute('data-css-file-mtime');
            if (!cssFileMTime) {
                cssFileMTime = 'cached';
            }

            let cssFile = this.getAttribute('data-css-file');
            if (!cssFile) {
                cssFile = '/inputter/inputter-m.css';
            }

            if (cssFile && cssFileMTime) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssFile + '?v=' + cssFileMTime;
                link.addEventListener('load', () => {
                    this.updateWidth();
                });

                this.linkAdded = true;
                this.shadowRoot.appendChild(link);
            }
        }

        // Либо онлайн — online (изменения сразу пушатся наверх), либо approvable — через подтверждение
        this.mode = this.getAttribute('data-mode');
        if (!this.mode) {
            this.mode = 'online';
        }

        // Если в аттрибутах установлена минимальная ширина
        const minWidth = this.getAttribute('data-min-width');
        if (minWidth) {
            this.container.style.minWidth = `${minWidth}px`;
            this.input.style.minWidth = `${minWidth}px`;
        }

        // Если в аттрибутах установлен плейсхолдер для инпута
        this.input.placeholder = this.getAttribute('placeholder') || this.defaultValue;

        // Если в аттрибутах установлен дополнительный css-класс
        this.additionalClass = this.getAttribute('data-additional-class');
        if (this.additionalClass) {
            this.container.classList.add(this.additionalClass);
        }

        this.allowNegative = this.getAttribute('is-allow-negative') === 'true';

        // Если в аттрибутах установлен суффикс
        this.numSuffix = this.getAttribute('data-suffix');
        this.setSuffix(true);

        let initialValue = this.getAttribute('value');

        this.value = initialValue;
        this.input.value = initialValue;
        this.stableValue = initialValue;

        // Подстраиваем ширину инпута под значение
        this.updateWidth();

        // Если режим подтверждения
        if (this.mode === 'approvable') {
            this.inputFocused = false;

            // Одно из условий, чтобы появилась галочка
            this.input.addEventListener('focus', () => {
                // Потому что пустой -- значит пустой.
                // Когда значение числа не введено, вместо нуля (и хита на его удаление),
                // пользователь ожидает, что начнёт вводить значение
                if (this.input.value === '0' && this.fieldType === 'numeric') {
                    this.input.value = '';
                }

                this.inputFocused = true;
            });

            // чистим в "число", подбираем ширину, запоминаем последнее значение (чтобы при подтверждении применить его значение), пинаем событие для галочки
            this.input.addEventListener('input', () => {
                this.postfix();
                this.updateWidth();
                this.lastValue = this.input.value;
                this.dispatchEvent(new Event('inputMove'));
            });

            // Метод подтверждения промежуточного значения, или возвращение к значению до редактирования
            // Вынес отдельно, потому что может пинаться через блюр веб-компонента или через Enter, Tab...
            this.approveOrReject = () => {
                if (this.approveReady) {
                    this.value = this.lastValue;
                    this.stableValue = this.lastValue;

                    this.approveReady = false;
                    this.dispatchEvent(new Event('change'));
                } else {
                    this.input.value = this.stableValue;
                    this.value = this.stableValue;

                    this.lastValue = this.stableValue;
                    this.dispatchEvent(new Event('reject'));
                }

                this.dispatchEvent(new Event('inputMove'));
                this.dispatchEvent(new Event('input'));
            }

            // Отлавливаем Enter, Tab, Esc
            this.input.addEventListener('keydown', evt => {
                if (evt.key === 'Enter' || evt.key === 'Tab') {
                    this.approveReady = true;
                    this.approveOrReject();
                    this.blur();
                }

                if (evt.key === 'Escape') {
                    this.approveReady = false;
                    this.approveOrReject();
                    this.blur();
                }
            });

            // Создаём элемент-галочку
            if (typeof this.approver === 'undefined') {
                // Наша галочка
                this.approver = document.createElement('div');
                this.approver.classList.add('approve');
                this.approver.innerText = '';

                // Когда инпут "двигается", проверяем и сравниваем, чтобы понять, должна галочка отображаться или нет.
                this.addEventListener('inputMove', () => {
                    if (this.inputFocused && this.lastValue !== this.stableValue) {
                        this.approver.classList.add('active');
                    } else {
                        this.approver.classList.remove('active');
                    }
                });

                this.container.appendChild(this.approver);

                // Инициализация переменной
                this.approveReady = false;

                // Мы не можем использовать click или mousedown, потому что blur подметает под себя событие. Потому мы фиксируем наведение на галочку (== намерение подтвердить изменения)
                this.approver.addEventListener('mouseover', () => {
                    this.approveReady = true;
                });

                // ...а также увод курсора мыши (== нет подтвержённого намерения принять изменения)
                this.approver.addEventListener('mouseout', () => {
                    this.approveReady = false;
                });
            }

            // Блюр веб-компонента (который срабатывает если мы даже внутри контейнера на что-то нажали)
            this.addEventListener('blur', () => {
                this.inputFocused = false;
                this.approveOrReject();
            });

        } else {
            // Динамический режим (online)
            this.input.addEventListener('input', () => {
                this.postfix();
                this.updateWidth();
            });
        }
    }

    // Каждый раз, когда кто-то извне запрашивает value нашего вебкомпонента, пинается этот getter.
    get value() {
        let result;

        if (this.mode === 'approvable') {
            result = this.stableValue || this.defaultValue;
        } else {
            result = this.input.value || this.defaultValue;
        }

        return result;
    }

    // Каждый раз, когда кто-то извне пытается установить value нашего вебкомпонента, пинается этот setter.
    // Важно здесь сохранять stableValue
    set value(val) {

        if (this.inputFocused) {
            //Прямо сейчас идёт ввод числа. Не нужно его сбивать
            return;
        }

        if (!val) {
            val = this.defaultValue;
        }

        this.stableValue = `${val}`;
        this.input.value = `${val}`;

        this.postfix();
        this.updateWidth();
    }

    // По скрытому элементу измеряем ширину инпута
    updateWidth() {
        let value = this.input.value || '0';
        this.measureSpan.textContent = value;

        // Получаем ширину скрытого элемента и устанавливаем её для input
        // Если вебкомпонент где-то в скрытом дом-дереве, ширина будет нулевой, потому мы выкручиваемся через длину символов (что даёт неточный результат, но это лучше, чем пустая ширина)
        if (this.measureSpan.offsetWidth <= 0) {
            this.input.style.width = `${value.length}ch`;
        } else {
            const width = this.measureSpan.offsetWidth;
            if (this.additionalClass === 'mega_excel_inputter') {
                // 20 - минимальная ширина, 10 - отступы
                this.input.style.width = `${Math.max(20, Math.min(this.container.offsetWidth - (this.suffix?.offsetWidth || 0) - 10, width))}px`;
            } else {
                this.input.style.width = `${width}px`;
            }

        }
    }
}

// Регистрируем веб-компонент
customElements.define('inputter-m', InputterSuffixOrNot);