// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;

import "./interfaces/IDateHelper.sol";

contract DateHelper is IDateHelper {
    uint256 private constant _DAY_IN_SECONDS = 86400;
    uint256 private constant _YEAR_IN_SECONDS = 31536000;
    uint256 private constant _LEAP_YEAR_IN_SECONDS = 31622400;
    uint16 private constant _ORIGIN_YEAR = 1970;
    mapping(uint256 => string) private _itoa;

    constructor() public {
        _itoa[1] = "01";
        _itoa[2] = "02";
        _itoa[3] = "03";
        _itoa[4] = "04";
        _itoa[5] = "05";
        _itoa[6] = "06";
        _itoa[7] = "07";
        _itoa[8] = "08";
        _itoa[9] = "09";
        _itoa[10] = "10";
        _itoa[11] = "11";
        _itoa[12] = "12";

        _itoa[2020] = "2020";
        _itoa[2021] = "2021";
        _itoa[2022] = "2022";
        _itoa[2023] = "2023";
        _itoa[2024] = "2024";
        _itoa[2025] = "2025";
        _itoa[2026] = "2026";
        _itoa[2027] = "2027";
        _itoa[2028] = "2028";
        _itoa[2029] = "2029";
        _itoa[2030] = "2030";
        _itoa[2031] = "2031";
        _itoa[2032] = "2032";
        _itoa[2033] = "2033";
        _itoa[2034] = "2034";
        _itoa[2035] = "2035";
        _itoa[2036] = "2036";
        _itoa[2037] = "2037";
        _itoa[2038] = "2038";
        _itoa[2039] = "2039";
        _itoa[2040] = "2040";
    }

    function _isLeapYear(uint256 year) private pure returns (bool) {
        if (year % 4 != 0) {
            return false;
        }
        if (year % 100 != 0) {
            return true;
        }
        if (year % 400 != 0) {
            return false;
        }
        return true;
    }

    function _leapYearsBefore(uint256 year) private pure returns (uint256) {
        year -= 1;
        return year / 4 - year / 100 + year / 400;
    }

    function _getDaysInMonth(uint256 month, uint256 year)
        private
        pure
        returns (uint256)
    {
        if (
            month == 1 ||
            month == 3 ||
            month == 5 ||
            month == 7 ||
            month == 8 ||
            month == 10 ||
            month == 12
        ) {
            return 31;
        } else if (month == 4 || month == 6 || month == 9 || month == 11) {
            return 30;
        } else if (_isLeapYear(year)) {
            return 29;
        } else {
            return 28;
        }
    }

    function isoYearMonth(uint256 timestamp)
        public
        override
        view
        returns (string memory)
    {
        uint256 secondsAccountedFor = 0;
        uint256 i;
        uint256 year = _getYear(timestamp);
        uint256 buf = _leapYearsBefore(year) - _leapYearsBefore(_ORIGIN_YEAR);

        secondsAccountedFor += _LEAP_YEAR_IN_SECONDS * buf;
        secondsAccountedFor += _YEAR_IN_SECONDS * (year - _ORIGIN_YEAR - buf);

        // Month
        uint256 month;
        uint256 secondsInMonth;
        for (i = 1; i <= 12; i++) {
            secondsInMonth = _DAY_IN_SECONDS * _getDaysInMonth(i, year);
            if (secondsInMonth + secondsAccountedFor > timestamp) {
                month = i;
                break;
            }
            secondsAccountedFor += secondsInMonth;
        }

        return string(abi.encodePacked(_itoa[year], "-", _itoa[month]));
    }

    function _getYear(uint256 timestamp) internal pure returns (uint256) {
        uint256 secondsAccountedFor = 0;
        uint16 year = uint16(_ORIGIN_YEAR + timestamp / _YEAR_IN_SECONDS);
        uint256 numLeapYears = _leapYearsBefore(year) -
            _leapYearsBefore(_ORIGIN_YEAR);

        secondsAccountedFor += _LEAP_YEAR_IN_SECONDS * numLeapYears;
        secondsAccountedFor +=
            _YEAR_IN_SECONDS *
            (year - _ORIGIN_YEAR - numLeapYears);

        while (secondsAccountedFor > timestamp) {
            if (_isLeapYear(uint16(year - 1))) {
                secondsAccountedFor -= _LEAP_YEAR_IN_SECONDS;
            } else {
                secondsAccountedFor -= _YEAR_IN_SECONDS;
            }
            year -= 1;
        }
        return year;
    }
}
