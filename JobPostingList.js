import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getActiveJobPostings from '@salesforce/apex/JobPostingController.getActiveJobPostings';
import getJobPostingDetails from '@salesforce/apex/JobPostingController.getJobPostingDetails';
 
export default class JobPostingList extends LightningElement {
    // Main data properties
    jobPostings = [];
    filteredJobPostings = [];
    
    // Filter and sort properties
    selectedDepartment = '';
    departments = [{ label: 'All Departments', value: '' }];
    
    // Sorting properties
    sortField = 'Posting_Date__c';
    sortDirection = 'desc';
    
    // Search property
    searchTerm = '';
    
    // Modal properties
    isModalOpen = false;
    selectedJobPosting = null;
    
    // Column definitions with more detailed configuration
    columns = [
        {
            label: 'Job Title',
            fieldName: 'Job_Title__c',
            type: 'text',
            sortable: true,
            cellAttributes: {
                class: { fieldName: 'priorityClass' }
            }
        },
        {
            label: 'Department',
            fieldName: 'Department__c',
            type: 'text',
            sortable: true
        },
        {
            label: 'Location',
            fieldName: 'Location__c',
            type: 'text'
        },
        {
            label: 'Open Positions',
            fieldName: 'Total_Open_Position__c',
            type: 'number',
            sortable: true
        },
        {
            label: 'Posting Date',
            fieldName: 'Posting_Date__c',
            type: 'date',
            sortable: true
        },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'View Details', name: 'view_details' }
                ]
            }
        }
    ];
 
    // Wire service to fetch job postings
    @wire(getActiveJobPostings)
    wiredJobPostings({ error, data }) {
        if (data) {
            // Process job postings
            this.jobPostings = data.map(posting => ({
                ...posting,
                priorityClass: this.getPriorityClass(posting.Total_Open_Positions__c)
            }));
            
            this.filteredJobPostings = [...this.jobPostings];
            this.extractDepartments();
        } else if (error) {
            this.handleError(error);
        }
    }
 
    // Extract unique departments
    extractDepartments() {
        const uniqueDepartments = new Set(
            this.jobPostings.map(job => job.Department__c).filter(dept => dept)
        );
        
        const departmentOptions = Array.from(uniqueDepartments)
            .map(dept => ({ label: dept, value: dept }));
        
        this.departments = [
            { label: 'All Departments', value: '' },
            ...departmentOptions
        ];
    }
 
    // Determine priority class based on open positions
    getPriorityClass(openPositions) {
        if (openPositions >= 10) return 'high-priority';
        if (openPositions >= 5) return 'medium-priority';
        return 'low-priority';
    }
 
    // Department filter handler
    handleDepartmentFilter(event) {
        const selectedDepartment = event.detail.value;
        this.selectedDepartment = selectedDepartment;
        this.applyFilters();
    }
 
    // Search input handler
    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilters();
    }
 
    // Comprehensive filtering method
    applyFilters() {
        let filteredResults = [...this.jobPostings];
 
        // Department filter
        if (this.selectedDepartment) {
            filteredResults = filteredResults.filter(
                job => job.Department__c === this.selectedDepartment
            );
        }
 
        // Search filter
        if (this.searchTerm) {
            filteredResults = filteredResults.filter(job =>
                job.Job_Title__c.toLowerCase().includes(this.searchTerm) ||
                job.Department__c.toLowerCase().includes(this.searchTerm) ||
                job.Location__c.toLowerCase().includes(this.searchTerm)
            );
        }
 
        this.filteredJobPostings = filteredResults;
    }
 
    // Sorting handler
    onSort(event) {
        const { fieldName, sortDirection } = event.detail;
        this.sortField = fieldName;
        this.sortDirection = sortDirection;
 
        this.filteredJobPostings = [...this.filteredJobPostings].sort((a, b) => {
            const valueA = a[fieldName];
            const valueB = b[fieldName];
            
            const sortMultiplier = sortDirection === 'asc' ? 1 : -1;
            
            if (valueA < valueB) return -1 * sortMultiplier;
            if (valueA > valueB) return 1 * sortMultiplier;
            return 0;
        });
    }
 
    // Row action handler
    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;
 
        switch (action.name) {
            case 'view_details':
                this.showJobDetails(row);
                break;
        }
    }
 
    // Show job details
    async showJobDetails(job) {
        try {
            // Fetch full job details
            const jobDetails = await getJobPostingDetails({ jobPostingId: job.Id });
            
            // Set selected job and open modal
            this.selectedJobPosting = jobDetails;
            this.isModalOpen = true;
        } catch (error) {
            this.handleError(error);
        }
    }
 
    // Close modal handler
    closeModal() {
        this.isModalOpen = false;
        this.selectedJobPosting = null;
    }
 
    // Error handling
    handleError(error) {
        console.error('Error fetching job postings', error);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Unable to fetch job postings',
                variant: 'error'
            })
        );
    }
}
