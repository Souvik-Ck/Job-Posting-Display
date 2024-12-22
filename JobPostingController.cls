public with sharing class JobPostingController {
    /**
     * @description Retrieves active job postings
     * @return List of active Job_Posting__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<Job_Posting__c> getActiveJobPostings() {
        return [
            SELECT
                Id,
                Job_Title__c,
                Location__c,
                Department__c,
                Total_Open_Position__c,
                Posting_Date__c
            FROM Job_Posting__c
 
            ORDER BY Posting_Date__c DESC
            LIMIT 200
        ];
    }
 
    /**
     * @description Retrieves job posting details by Id
     * @param jobPostingId Id of the job posting
     * @return Job_Posting__c record
     */
    @AuraEnabled(cacheable=true)
    public static Job_Posting__c getJobPostingDetails(Id jobPostingId) {
        return [
            SELECT
                Id,
                Job_Title__c,
                Department__c,
                Location__c,
                Total_Open_Position__c
            FROM Job_Posting__c
            WHERE Id = :jobPostingId
            LIMIT 1
        ];
    }
}
