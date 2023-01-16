export interface TextField {
  type: "text"
  name: string
  label: string
  placeholder: string
  mutable: boolean
  regex: string
}
export interface SelectField {
  type: "options"
  name: string
  label: string
  options: (string | number)[]
  mutable: boolean
}

export type Field = SelectField | TextField

export const fields: Field[] = [
  {
    type: "text",
    name: "displayName",
    label: "Enter Name",
    mutable: true,
    placeholder: "Firstname Lastname",
    regex: ".+",
  },
  {
    type: "text",
    name: "email",
    label: "Email ID",
    mutable: false,
    placeholder: "user@example.com",
    regex: ".+",
  },
  {
    type: "options",
    name: "gender",
    label: "Gender",
    mutable: true,
    options: ["Male", "Female"],
  },
  {
    type: "text",
    name: "collegeName",
    label: "College Name",
    mutable: true,
    placeholder: "PCCOE",
    regex: ".+",
  },
  {
    type: "options",
    name: "graduationYear",
    label: "Graduation Year",
    mutable: true,
    options: [2023, 2024, 2025, 2026],
  },
  {
    type: "text",
    name: "collegeBranch",
    label: "Branch",
    mutable: true,
    placeholder: "IT/Comp/Mech",
    regex: ".+",
  },
  {
    type: "text",
    name: "hackerrank",
    label: "HackerRank Profile Link",
    mutable: true,
    placeholder: "https://www.hackerrank.com/username",
    regex: ".+",
  },
  {
    type: "text",
    name: "leetcode",
    label: "Leetcode Profile Link",
    mutable: true,
    placeholder: "https://leetcode.com/username",
    regex: ".+",
  },
  {
    type: "text",
    name: "linkedin",
    label: "LinkedIn Profile Link",
    mutable: true,
    placeholder: "https://www.linkedin.com/in/username",
    regex: ".+",
  },
  {
    type: "text",
    name: "codechef",
    label: "Codechef Profile Link",
    mutable: true,
    placeholder: "https://www.codechef.com/users/username",
    regex: ".+",
  },
  {
    type: "text",
    name: "phoneNumber",
    label: "Phone Number",
    mutable: true,
    placeholder: "+91987654321",
    regex: ".+",
  },
];
