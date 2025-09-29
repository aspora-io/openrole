/**
 * Simple Job Board Core Front-end JS File - V 2.10.0
 *
 * @author PressTigers <support@presstigers.com>, 2016
 *
 * Actions List
 * - Job Application Submission Callbacks
 * - Date Picker Initialization
 * - Validate Email
 * - Initialize TelInput Plugin
 * - Validate Phone Number
 * - Allowable Uploaded File's Extensions
 * - Validate Required Inputs ( Attachment, Phone & Email )
 * - Checkbox Group Required Attribute Callbacks
 * - Custom Styling of File Upload Button
 */
(function ($) {
    "use strict";
  
    $(document).ready(function () {
      var jobpost_submit_button = $(".app-submit");
     
      var jobpost_form_status = $("#jobpost_form_status");
      
      $(document).ready(function () {
   
        /* Add custom validation method for file extensions */
        $.validator.addMethod(
          "filetype",
          function (value, element, param) {
            return this.optional(element) || param.test(value.toLowerCase());
          },
          application_form.jquery_alerts["invalid_extension"]
        );
  
        /* Initialize validation on the form */
        $(".jobpost-form").validate({
          ignore: [], /* Ensure hidden fields are also validated */
          errorPlacement: function (error, element) {
            /* Customize error messages */
            error.insertAfter(element);
          },
          submitHandler: function (form) {
           
            /* Add your submission function here */
            var formObj = $("#sjb-application-form");
            var datastring = new FormData(formObj[0]);
            submitForm(datastring);
          },
        });
        
        
      /* Add rules for required fields with class 'sjb-required' */
        $(".sjb-required").each(function () {
          let fieldName = $(this).attr("name");
          /* Check if fieldName exists and is a string */
          if (typeof fieldName === "string") {
              fieldName = fieldName.replace(/^jobapp_/, ""); 
              
            /* Replace underscores with spaces and capitalize each word */
            var fieldLabel = $(this).data("label") || fieldName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
            $(this).css("color", "black");   
            if(fieldLabel == 'Tc' || fieldLabel == 'Pp'){
              $(this).rules("add", {
                  required: true,
                  messages: {
                    required: application_form.jquery_alerts["sjb_application_input_required"],
                  },
              });
            }else{
              $(this).rules("add", {
                  required: true,
                  messages: {
                    required: fieldLabel + ' ' + application_form.is_required,
                  },
              });
            }
          }
        });
  
        /* Add email validation for fields with class 'sjb-email-address' */
        $(".sjb-email-address").each(function () {
            let fieldName = $(this).attr("name"); /* Get the field name */
        
            
            if (typeof fieldName === "string") {
                fieldName = fieldName.replace(/^jobapp_/, ""); 
                var fieldLabel = $(this).data("label") || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                fieldLabel = fieldLabel.replace('_', ' ');
 
        
                $(this).css("color", "black"); /* Set text color to black */
                $(this).rules("add", {
                    required: true,
                    email: true,
                    messages: {
                        required: fieldLabel + ' ' + application_form.is_required,
                        email: application_form.jquery_alerts["sjb_application_enter_valid"] + fieldLabel,
                    },
                });
            }
        });
        var allowed_file_exts = Array.isArray(application_form.setting_extensions)
        ? application_form.setting_extensions.filter(ext => typeof ext === "string").join(",")
        : "";
        if(allowed_file_exts == ''){
          allowed_file_exts = application_form.allowed_extensions.filter(ext => typeof ext === "string").join(",")
        }
        var fileTypePattern = new RegExp(
          `(\\.${allowed_file_exts.replace(/,/g, "|")})$`,
          "i"
        );
        
        /* File type validation for applicant resume */
        if (!$("#applicant-resume").hasClass("sjb-not-required")) {
        $("#applicant-resume").rules("add", {
          required: true,
          filetype: fileTypePattern,
          messages: {
            required:
              application_form.jquery_alerts["sjb_application_resume_required"] + application_form.is_required,
            filetype: application_form.jquery_alerts["invalid_extension"],
          },
        });
      }
      });

      
      function initializePopupValidation() {
        /* Reapply validation to dynamically added popup form */
        const popupForm = $(".jobpost-form");
        
        
          popupForm.validate({
              ignore: [], /* Ensure hidden fields are also validated */
              errorPlacement: function (error, element) {
                  error.insertAfter(element);
              },
              submitHandler: function (form) {
                  /* Custom submission logic */
                  const formObj = $(form);
                  const datastring = new FormData(formObj[0]);
                  submitForm(datastring); 
              },
          });
      
          /* Add rules for required fields with class 'sjb-required' */
          popupForm.find(".sjb-required").each(function () {
              let fieldName = $(this).attr("name");
              if (typeof fieldName === "string") {
                  fieldName = fieldName.replace(/^jobapp_/, ""); 
                  var fieldLabel = $(this).data("label") || fieldName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
                   $(this).css("color", "black");
                  if(fieldLabel == 'Tc' || fieldLabel == 'Pp'){
                    $(this).rules("add", {
                        required: true,
                        messages: {
                          required: application_form.jquery_alerts["sjb_application_input_required"],
                        },
                    });
                  }else{
                    $(this).rules("add", {
                        required: true,
                        messages: {
                          required: fieldLabel + ' ' + application_form.is_required,
                        },
                    });
                  }
              }
          });
      
          /* Add email validation for fields with class 'sjb-email-address' */
          popupForm.find(".sjb-email-address").each(function () {
              let fieldName = $(this).attr("name");
              if (typeof fieldName === "string") {
                  fieldName = fieldName.replace(/^jobapp_/, "");
                  var fieldLabel = $(this).data("label") || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                  fieldLabel = fieldLabel.replace('_', ' ');
 
                  $(this).css("color", "black");
                  $(this).rules("add", {
                      required: true,
                      email: true,
                      messages: {
                          required: fieldLabel + ' ' + application_form.is_required,
                          email: application_form.jquery_alerts["sjb_application_enter_valid"] + fieldLabel,
                      },
                  });
              }
          });
          
          /* File type validation for applicant resume */
          var allowed_file_exts = Array.isArray(application_form.setting_extensions)
        ? application_form.setting_extensions.filter(ext => typeof ext === "string").join(",")
        : "";

        if(allowed_file_exts == ''){
          allowed_file_exts = application_form.allowed_extensions.filter(ext => typeof ext === "string").join(",")
        }
          const fileTypePattern = new RegExp(`(\\.${allowed_file_exts.replace(/,/g, "|")})$`, "i");
          setTimeout(function() {
            if (!popupForm.find("#applicant-resume").hasClass("sjb-not-required")) {
              popupForm.find("#applicant-resume").rules("add", {
                  required: true,
                  filetype: fileTypePattern,
                  messages: {
                      required: application_form.jquery_alerts["sjb_application_resume_required"]+  application_form.is_required,
                      filetype: application_form.jquery_alerts["invalid_extension"],
                  },
              });
            }
          }, 500);
      }
    
      function submitForm(datastring) {
    
        const jobpost_form_status = $("#jobpost_form_status"); 
        const jobpost_submit_button = $(".jobpost-form .app-submit");
    
        $(".sjb-loading").show();
        $.ajax({
          url: application_form.ajaxurl,
          type: "POST",
          dataType: "json",
          data: datastring,
          async: true,
          cache: false,
          contentType: false,
          processData: false,
          statusCode: {
            500: function (responseObject, textStatus, jqXHR) {
              alert(
                "505: Server internal error occurred while processing application. Please try again."
              );
              $(".sjb-loading").hide();
  
              /* Translation Ready String Through Script Localization */
              jobpost_form_status.html(
                responseObject.responseJSON["error"] +
                  " " +
                  application_form.jquery_alerts["application_not_submitted"] +
                  "</div>"
              );
            },
            503: function (responseObject, textStatus, errorThrown) {
              alert("503: Service Unavailable. Please try again.");
              $(".sjb-loading").hide();
  
              /* Translation Ready String Through Script Localization */
              jobpost_form_status.html(
                responseObject.responseJSON["error"] +
                  " " +
                  application_form.jquery_alerts["application_not_submitted"] +
                  "</div>"
              );
            },
          },
          beforeSend: function () {
            jobpost_submit_button.attr("disabled", "disabled");
          },
          success: function (response) {
            if (response["success"] == true) {
              $(".jobpost-form").slideUp();
  
              /* Translation Ready String Through Script Localization */
              jobpost_form_status.html(response["success_alert"]);
            }
  
            if (response["success"] == false) {
              /* Translation Ready String Through Script Localization */
              jobpost_form_status.html(
                response["error"] +
                  " " +
                  application_form.jquery_alerts["application_not_submitted"] +
                  "</div>"
              );
  
              $(".sjb-loading").hide();
  
              jobpost_submit_button.removeAttr("disabled");
            }
          },
        });
    }
    
  
      /**
       * Initialize Datepicker
       *
       * @since   2.10.0
       */
      function initialize_date() {
        /* Date Picker */
     
        $(".sjb-datepicker").datepicker({
          dateFormat: application_form.sjb_date_format,
          changeMonth: true,
          changeYear: true,
          yearRange: "-100:+50",
        });
      }
      initialize_date();
  
      /**
       * Application Form -> On Input Email Validation
       *
       * @since   2.2.0
       */
      $(document).on("input", ".sjb-email-address", function () {
        var input = $(this);
        var re =
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        var is_email = re.test(input.val());
        var error_element = $(this).next();
        if (is_email) {
          input.removeClass("invalid").addClass("valid");
          error_element.hide();
        } else {
          input.removeClass("valid").addClass("invalid");
        }
      });
  
      /**
       * Initialize TelInput Plugin
       *
       * @since   2.2.0
       */
      function initialize_tel() {
        if ($(".sjb-phone-number").length) {
          var telInput_id = $(".sjb-phone-number")
            .map(function () {
              return this.id;
            })
            .get();
  
          for (var input_ID in telInput_id) {
            var telInput = $("#" + telInput_id[input_ID]);
            telInput.intlTelInput({
              initialCountry: "auto",
              geoIpLookup: function (callback) {
                $.get("https://ipinfo.io", function () {}, "jsonp").always(
                  function (resp) {
                    var countryCode = resp && resp.country ? resp.country : "";
                    callback(countryCode);
                  }
                );
              },
            });
          }
        }
      }
      if(application_form.isPhoneFormattingdisabled !='yes'){
        initialize_tel();
      }
  
      /**
       * Application Form -> Phone Number Validation
       *
       * @since 2.2.0
       */
      $(document).on("input", ".sjb-phone-number", function () {
        var telInput = $(this);
        var telInput_id = $(this).attr("id");
        var error_element = $("#" + telInput_id + "-invalid-phone");
        error_element.hide();
  
        /* Validate Phone Number */
        if ($.trim(telInput.val())) {
            if (typeof telInput.intlTelInput === "function" && telInput.intlTelInput("isValidNumber")) {
                telInput.removeClass("invalid").addClass("valid");
                error_element.hide();
            } else {
                telInput.removeClass("valid").addClass("invalid");
            }
        }
      });

  
      /**
       * Stop Form Submission -> On Required Attachments
       *
       * @since 2.3.0
       */
      function sjb_is_attachment(event) {
        var error_free = true;
        $(".sjb-attachment").each(function () {
          var element = $("#" + $(this).attr("id"));
          var valid = element.hasClass("valid");
          var is_required_class = element.hasClass("sjb-not-required");
  
          /* Set Error Indicator on Invalid Attachment */
          if (!valid) {
            if (!(is_required_class && 0 === element.get(0).files.length)) {
              error_free = false;
            }
          }
  
          /* Stop Form Submission */
          if (!error_free) {
            event.preventDefault();
          }
        });
  
        return error_free;
      }
  
      /**
       * Stop Form Submission -> On Invalid Email/Phone
       *
       * @since 2.2.0
       */
      function sjb_is_valid_input(event, input_type, input_class) {
        var jobpost_form_inputs = $("." + input_class).serializeArray();
        var error_free = true;
  
        for (var i in jobpost_form_inputs) {
          var element = $("#" + jobpost_form_inputs[i]["name"]);
          var valid = element.hasClass("valid");
          var is_required_class = element.hasClass("sjb-not-required");
          if (!(is_required_class && "" === jobpost_form_inputs[i]["value"])) {
            if ("email" === input_type) {
              var error_element = $("span", element.parent());
            } else if ("phone" === input_type) {
              var error_element = $(
                "#" + jobpost_form_inputs[i]["name"] + "-invalid-phone"
              );
            }
  
            /* Set Error Indicator on Invalid Input */
            if (!valid) {
              error_element.show();
              error_free = false;
            } else {
              error_element.hide();
            }
  
            /* Stop Form Submission */
            if (!error_free) {
              event.preventDefault();
            }
          }
        }
        return error_free;
      }
  
      /**
       * Remove Required Attribute from Checkbox Group -> When one of the option is selected.
       *
       * Add Required Attribute from Checkboxes Group -> When none of the option is selected.
       *
       * @since   2.3.0
       */
      function initialize_checkbox() {
        var requiredCheckboxes = $(":checkbox[required]");
        requiredCheckboxes.on("change", function () {
          var checkboxGroup = requiredCheckboxes.filter(
            '[name="' + $(this).attr("name") + '"]'
          );
          var isChecked = checkboxGroup.is(":checked");
          checkboxGroup.prop("required", !isChecked);
        });
      }
      initialize_checkbox();
  
      /* Accept Numbers Input Only */
      function initialize_keypress() {
        $(".sjb-numbers-only").keypress(function (evt) {
          evt = evt ? evt : window.event;
          var charCode = evt.which ? evt.which : evt.keyCode;
          if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
          }
          return true;
        });
      }
      initialize_keypress();
  
      /*
       * Custom Styling of Upload Field Button
       *
       * @since   2.4.0
       */
      var file = {
        maxlength: 20, /* maximum length of filename before it's trimmed */
  
        convert: function () {
          /* Convert all file type inputs. */
          $("input[type=file].sjb-attachment").each(function () {
            $(this).wrap('<div class="file" />');
            $(this)
              .parent()
              .prepend("<div>" + application_form.file["browse"] + "</div>");
            $(this)
              .parent()
              .prepend(
                "<span>" + application_form.file["no_file_chosen"] + "</span>"
              );
            $(this).fadeTo(0, 0);
            $(this).attr("size", "50"); /* Use this to adjust width for FireFox. */
          });
        },
        update: function (x) {
          /* Update the filename display. */
          var filename = x.val().replace(/^.*\\/g, "");
          if (filename.length > $(this).maxlength) {
            trim_start = $(this).maxlength / 2 - 1;
            trim_end = trim_start + filename.length - $(this).maxlength + 1;
            filename =
              filename.substr(0, trim_start) +
              "&#8230;" +
              filename.substr(trim_end);
          }
  
          if (filename == "") filename = application_form.file["no_file_chosen"];
          x.siblings("span").html(filename);
        },
      };
  
      file.convert();
      $(document).on("change", "input[type=file].sjb-attachment", function () {
        file.update($(this));
      });
      
      $(document).on("click", "body #quick-apply-btn", function (e) {
        e.preventDefault();
        
        var obj = $(this);
        var job_id = obj.attr("job_id");
        if (obj.data("loading")) {
          return; 
        }
        obj.data("loading", true);
        $.ajax({
          url: application_form.ajaxurl,
          type: "POST",
          data: {
            action: "fetch_quick_job",
            job_id: job_id,
          },
          success: function (response) {
            $(".sjb-page").append(response);
            $(".sjb-page").find(".popup-outer").fadeIn();
            file.convert();
            initialize_date();
            initialize_tel();
            initialize_checkbox();
            initialize_keypress();
            initializePopupValidation();
            $(".popup-outer .sjb-page .sjb-detail")
              .prepend(`<div class="sjb-quick-apply-modal-close-btn">
                  <span class="close">x</span>
            </div>`);
          },
          complete: function () {
            obj.data("loading", false); 
          },
          error: function () {
              obj.data("loading", false); 
          },
        });
      });
  
      $(document).on("click", ".sjb-quick-apply-modal-close-btn", function () {
        if (confirm(application_form.jquery_alerts.sjb_quick_job_close)) {
          $(".sjb-page .popup-outer").fadeOut();
          $(".sjb-page .popup-outer").remove();
        }
      });
  
      $(".sjb_view_more_btn").on("click", function () {
        var post_id = $(this).data("id");
        $("#sjb_more_content_" + post_id).css("display", "block");
        $("#sjb_less_content_" + post_id).css("display", "none");
        $("#sjb_view_less_btn_" + post_id).css("display", "inline");
      });
  
      $(".sjb_view_less_btn").on("click", function () {
        var post_id = $(this).data("id");
        $("#sjb_more_content_" + post_id).css("display", "none");
        $("#sjb_less_content_" + post_id).css("display", "block");
        $("#sjb_view_less_btn_" + post_id).css("display", "none");
      });
      var filess = {
        maxlength: 20, /* maximum length of filename before it's trimmed */
  
        update: function (x) {
          /* Update the filename display. */
          var files = x.prop("files");
          var fileList = "";
          var count = 0;
          for (var i = 0; i < files.length; i++) {
            fileList += "<p>" + files[i].name + "</p>";
            count++;
          }
  
          if (count > 1) {
            x.siblings("span").html(count + "" + " Files Selected");
          } else if (count == 1) {
            x.siblings("span").html(files[0].name);
          }
        },
      };
      /* Update the resume field value */
      $(document).on("change", "input[name='applicant_resume[]']", function () {
        filess.update($(this));
      });
  
      /* Tags in Search filter */
      $(".sjb-tags-search").on("click", function (event) {
        event.preventDefault(); /* Prevent default link behavior */
  
        if ($(this).hasClass("tag-active")) {
          $(this).removeClass("tag-active");
        } else {
          $(this).addClass("tag-active");
        }
  
        var linkValue = $(".tag-active")
          .map(function () {
            return $(this).data("value");
          })
          .get();
  
        $("#selected_tag").val(linkValue);
        $(".filters-form").submit(); /* Submit the form */
      });
    });
    
  })(jQuery);
  