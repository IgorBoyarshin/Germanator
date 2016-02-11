angular.module("mainApp").controller("settingsCtrl", function($scope, $http, $timeout, mainFactory) {
    $scope.factory = mainFactory;
    $scope.sortTableBy = "";
    $scope.isSortingReversed = true;

    $scope.saveCurrentUsedTags = function() {
        var tags = document.getElementsByClassName("tagCheckbox");
        var noneChecked = true;

        for (j = 0; j < tags.length; j++) { // length is supposed to be equal to existingTags' length
            var index = $scope.factory.getIndexOfTagInExistingTags(tags[j].value);
            if (index != -1) {
                $scope.factory.existingTags[index].used = tags[j].checked;

                if (tags[j].checked) {
                    noneChecked = false;
                }
            } else {
                console.log('OMG in setings');
            }
        }

        if (noneChecked) {
            $scope.checkAllTags();
            $scope.saveCurrentUsedTags();
        } else {
            $scope.factory.setCurrentTagsIndices();
        }
    };

    // $scope.findAndSetExistingTags = function() {
    //     $scope.factory.existingTags = []; // reset previous
    //
    //     for (j = 0; j < $scope.factory.wordsDatabase.inProgress.length + $scope.factory.wordsDatabase.learned.length; j++) {
    //         if (j < $scope.factory.wordsDatabase.inProgress.length) {
    //             if(!$scope.isTagInExistingTags($scope.factory.wordsDatabase.inProgress[j].t)) {
    //                 $scope.factory.existingTags.push($scope.factory.wordsDatabase.inProgress[j].t);
    //             }
    //         } else {
    //             if(!$scope.isTagInExistingTags($scope.factory.wordsDatabase.learned[j - $scope.factory.wordsDatabase.inProgress.length].t)) {
    //                 $scope.factory.existingTags.push($scope.factory.wordsDatabase.learned[j - $scope.factory.wordsDatabase.inProgress.length].t);
    //             }
    //         }
    //     }
    // };

    // Called when the 'save' button in settings is pressed
    // Or when words are added/deleted, we have to
    // update the list
    // $scope.setCurrentUsedTags = function() {
    //     var tags = document.getElementsByClassName("tagCheckbox");
    //     $scope.factory.currentUsedTags = [];
    //
    //     for (i = 0; i < tags.length; i++) {
    //         if (tags[i].checked) {
    //             $scope.factory.currentUsedTags.push(tags[i].value);
    //         }
    //     }
    //
    //     // if none -> setIndexesForCurrentTags() will handle it
    //     $scope.setIndexesForCurrentTags();
    // };

    //
    // $scope.setIndexesForCurrentTags = function() {
    //     $scope.factory.currentTagsIndexes = [];
    //
    //     // If none -> use all
    //     if ($scope.factory.currentUsedTags.length == 0) {
    //         for (j = 0; j < $scope.factory.wordsDatabase.inProgress.length + $scope.factory.wordsDatabase.learned.length; j++) {
    //             $scope.factory.currentTagsIndexes.push(j);
    //         }
    //     } else {
    //         for (j = 0; j < $scope.factory.wordsDatabase.inProgress.length + $scope.factory.wordsDatabase.learned.length; j++) {
    //             if (j < $scope.factory.wordsDatabase.inProgress.length) {
    //                 if ($scope.isTagInCurrentTags($scope.factory.wordsDatabase.inProgress[j].t)) {
    //                     $scope.factory.currentTagsIndexes.push(j);
    //                 }
    //             } else {
    //                 if ($scope.isTagInCurrentTags($scope.factory.wordsDatabase.learned[j - $scope.factory.wordsDatabase.inProgress.length].t)) {
    //                     $scope.factory.currentTagsIndexes.push(j);
    //                 }
    //             }
    //         }
    //     }
    //
    //     console.log($scope.factory.currentTagsIndexes.length);
    // };

    $scope.checkAllTags = function() {
        var tags = document.getElementsByClassName("tagCheckbox");
        var allChecked = true;

        for (i = 0; i < tags.length; i++) {
            if (!tags[i].checked) {
                tags[i].checked = true;
                allChecked = false;
            }
        }
        if (allChecked) {
            for (i = 0; i < tags.length; i++) {
                tags[i].checked = false;
            }
        }
    };
});
